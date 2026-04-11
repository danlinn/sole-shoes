"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema, type ReportInput } from "@/lib/validations";

export async function createReport(input: ReportInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.report.create({
    data: {
      reporterId: session.user.id,
      shoePostId: parsed.data.shoePostId || null,
      reportedUserId: parsed.data.reportedUserId || null,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    },
  });

  return { success: true };
}

export async function blockUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  if (userId === session.user.id) {
    return { error: "Cannot block yourself" };
  }

  await db.block.upsert({
    where: {
      blockerId_blockedUserId: {
        blockerId: session.user.id,
        blockedUserId: userId,
      },
    },
    create: {
      blockerId: session.user.id,
      blockedUserId: userId,
    },
    update: {},
  });

  return { success: true };
}
