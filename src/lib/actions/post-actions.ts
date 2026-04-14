"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shoePostSchema, type ShoePostInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { PostStatus } from "@/generated/prisma/enums";

export async function createShoePost(input: ShoePostInput, imageUrls: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const parsed = shoePostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const post = await db.shoePost.create({
    data: {
      ...parsed.data,
      dateOccurred: new Date(parsed.data.dateOccurred),
      userId: session.user.id,
      images: {
        create: imageUrls.map((url, i) => ({
          imageUrl: url,
          sortOrder: i,
          isPrimary: i === 0,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  return { success: true, postId: post.id };
}

export async function updateShoePost(
  postId: string,
  input: Partial<ShoePostInput>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post || post.userId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.shoePost.update({
    where: { id: postId },
    data: {
      ...input,
      dateOccurred: input.dateOccurred
        ? new Date(input.dateOccurred)
        : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath(`/listings/${postId}`);
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function deleteShoePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post) return { error: "Post not found" };

  const isAdmin = (session.user as unknown as Record<string, unknown>).isAdmin;
  if (post.userId !== session.user.id && !isAdmin) {
    return { error: "Not authorized" };
  }

  await db.shoePost.delete({ where: { id: postId } });

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function updatePostStatus(postId: string, status: PostStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post || post.userId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.shoePost.update({
    where: { id: postId },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/listings/${postId}`);
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function getRecentPosts(params: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  side?: string;
  size?: string;
  color?: string;
  search?: string;
  status?: string;
}) {
  const {
    page = 1,
    limit = 12,
    type,
    category,
    side,
    size,
    color,
    search,
    status,
  } = params;

  const where: Record<string, unknown> = {};

  if (type && (type === "LOST" || type === "FOUND")) {
    where.type = type;
  }
  if (category) where.category = category;
  if (side && (side === "LEFT" || side === "RIGHT")) where.side = side;
  if (size) where.size = size;
  if (color) where.primaryColor = { contains: color, mode: "insensitive" };
  if (status) {
    where.status = status;
  } else {
    where.status = { in: ["OPEN", "POTENTIAL_MATCH"] };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    db.shoePost.findMany({
      where: where as never,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.shoePost.count({ where: where as never }),
  ]);

  return {
    posts,
    total,
    pages: Math.ceil(total / limit),
    page,
  };
}

export async function getPostById(postId: string) {
  return db.shoePost.findUnique({
    where: { id: postId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      user: { select: { id: true, name: true, image: true, city: true, createdAt: true } },
      aiAttributes: true,
      sourceSuggestions: {
        where: { status: "SUGGESTED" },
        include: {
          candidatePost: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { score: "desc" },
        take: 5,
      },
    },
  });
}
