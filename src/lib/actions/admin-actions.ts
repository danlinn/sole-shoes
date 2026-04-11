"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportStatus } from "@/generated/prisma";
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
  revalidatePath("/listings");
}
