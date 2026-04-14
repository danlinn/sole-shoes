"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAdminStats() {
  await requireAdmin();

  const [
    totalUsers,
    totalListings,
    openListings,
    confirmedMatches,
    openReports,
    totalSuggestions,
    confirmedSuggestions,
  ] = await Promise.all([
    db.user.count(),
    db.shoePost.count(),
    db.shoePost.count({ where: { status: "OPEN" } }),
    db.shoePost.count({ where: { status: "MATCHED" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.matchSuggestion.count(),
    db.matchSuggestion.count({ where: { status: "CONFIRMED" } }),
  ]);

  const acceptanceRate =
    totalSuggestions > 0
      ? Math.round((confirmedSuggestions / totalSuggestions) * 100)
      : 0;

  return {
    totalUsers,
    totalListings,
    openListings,
    confirmedMatches,
    openReports,
    acceptanceRate,
    totalSuggestions,
    confirmedSuggestions,
  };
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
) {
  await requireAdmin();

  await db.report.update({
    where: { id: reportId },
    data: { status },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function deletePostAdmin(postId: string) {
  await requireAdmin();

  await db.shoePost.delete({
    where: { id: postId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/listings");
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  disabled: boolean;
  createdAt: Date;
  listingCount: number;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      disabled: true,
      createdAt: true,
      _count: { select: { shoePosts: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    disabled: u.disabled,
    createdAt: u.createdAt,
    listingCount: u._count.shoePosts,
  }));
}

export async function setUserDisabled(
  userId: string,
  disabled: boolean
): Promise<{ success: true } | { error: string }> {
  const session = await requireAdmin();

  if (userId === session.user!.id && disabled) {
    return { error: "You cannot disable your own account" };
  }

  await db.user.update({
    where: { id: userId },
    data: { disabled },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAdminPosts(page = 1, limit = 20) {
  await requireAdmin();

  const [posts, total] = await Promise.all([
    db.shoePost.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    db.shoePost.count(),
  ]);

  return {
    posts,
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  };
}
