"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function updateProfile(input: ProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      city: parsed.data.city || null,
      preferredContact: parsed.data.preferredContact || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      preferredContact: true,
      image: true,
      createdAt: true,
    },
  });
}
