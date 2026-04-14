"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shoePostSchema, type ShoePostInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { PostStatus } from "@/generated/prisma/enums";

function isAdminSession(session: { user?: { id?: string; isAdmin?: boolean } }) {
  return Boolean(session.user?.isAdmin);
}

export async function createShoePost(input: ShoePostInput, imageUrls: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }
  if (session.user.disabled) {
    return { error: "Your account has been disabled" };
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
  input: ShoePostInput,
  imageUrls?: string[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }
  if (session.user.disabled) {
    return { error: "Your account has been disabled" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post) {
    return { error: "Post not found" };
  }

  const admin = isAdminSession(session);
  if (post.userId !== session.user.id && !admin) {
    return { error: "Not authorized" };
  }

  const parsed = shoePostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.$transaction(async (tx) => {
    await tx.shoePost.update({
      where: { id: postId },
      data: {
        ...parsed.data,
        dateOccurred: new Date(parsed.data.dateOccurred),
      },
    });

    if (imageUrls !== undefined) {
      await tx.shoeImage.deleteMany({ where: { shoePostId: postId } });
      if (imageUrls.length > 0) {
        await tx.shoeImage.createMany({
          data: imageUrls.map((url, i) => ({
            shoePostId: postId,
            imageUrl: url,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        });
      }
    }
  });

  revalidatePath("/");
  revalidatePath(`/listings/${postId}`);
  revalidatePath("/dashboard/listings");
  if (admin) {
    revalidatePath("/admin");
    revalidatePath("/admin/posts");
  }
  return { success: true };
}

export async function deleteShoePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post) return { error: "Post not found" };

  const admin = isAdminSession(session);
  if (post.userId !== session.user.id && !admin) {
    return { error: "Not authorized" };
  }

  await db.shoePost.delete({ where: { id: postId } });

  revalidatePath("/");
  revalidatePath("/dashboard/listings");
  if (admin) {
    revalidatePath("/admin");
    revalidatePath("/admin/posts");
  }
  return { success: true };
}

export async function updatePostStatus(postId: string, status: PostStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }
  if (session.user.disabled) {
    return { error: "Your account has been disabled" };
  }

  const post = await db.shoePost.findUnique({ where: { id: postId } });
  if (!post) {
    return { error: "Post not found" };
  }

  const admin = isAdminSession(session);
  if (post.userId !== session.user.id && !admin) {
    return { error: "Not authorized" };
  }

  await db.shoePost.update({
    where: { id: postId },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/listings/${postId}`);
  revalidatePath("/dashboard/listings");
  if (admin) {
    revalidatePath("/admin");
    revalidatePath("/admin/posts");
  }
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

  const filters: Record<string, unknown>[] = [{ user: { disabled: false } }];

  if (type && (type === "LOST" || type === "FOUND")) {
    filters.push({ type });
  }
  if (category) filters.push({ category });
  if (side && (side === "LEFT" || side === "RIGHT")) filters.push({ side });
  if (size) filters.push({ size });
  if (color) filters.push({ primaryColor: { contains: color, mode: "insensitive" } });
  if (status) {
    filters.push({ status });
  } else {
    filters.push({ status: { in: ["OPEN", "POTENTIAL_MATCH"] } });
  }
  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: filters };

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
  const session = await auth();
  const admin = Boolean(session?.user?.isAdmin);

  const post = await db.shoePost.findUnique({
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

  if (!post) {
    return null;
  }

  if (!admin) {
    const owner = await db.user.findUnique({
      where: { id: post.userId },
      select: { disabled: true },
    });
    if (owner?.disabled) {
      return null;
    }
  }

  return post;
}
