"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function dismissSuggestion(suggestionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authorized" };

  const suggestion = await db.matchSuggestion.findUnique({
    where: { id: suggestionId },
    include: { sourcePost: { select: { userId: true } } },
  });

  if (!suggestion || suggestion.sourcePost.userId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.matchSuggestion.update({
    where: { id: suggestionId },
    data: { status: "DISMISSED" },
  });

  revalidatePath("/dashboard/ai-suggestions");
  return { success: true };
}

export async function confirmSuggestion(suggestionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authorized" };

  const suggestion = await db.matchSuggestion.findUnique({
    where: { id: suggestionId },
    include: { sourcePost: { select: { userId: true } } },
  });

  if (!suggestion || suggestion.sourcePost.userId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.matchSuggestion.update({
    where: { id: suggestionId },
    data: { status: "CONFIRMED" },
  });

  revalidatePath("/dashboard/ai-suggestions");
  return { success: true };
}

export async function getUserSuggestions() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.matchSuggestion.findMany({
    where: {
      sourcePost: { userId: session.user.id },
      status: "SUGGESTED",
    },
    include: {
      sourcePost: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      candidatePost: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { score: "desc" },
  });
}
