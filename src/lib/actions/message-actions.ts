"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendMessage(conversationId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return { error: "Conversation not found" };

  const isParticipant =
    conversation.participantOneId === session.user.id ||
    conversation.participantTwoId === session.user.id;

  if (!isParticipant) {
    return { error: "Not authorized" };
  }

  const recipientId =
    conversation.participantOneId === session.user.id
      ? conversation.participantTwoId
      : conversation.participantOneId;

  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        body,
      },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
    db.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New Message",
        body: body.length > 50 ? body.slice(0, 50) + "..." : body,
        data: { conversationId },
      },
    }),
  ]);

  revalidatePath(`/dashboard/messages/${conversationId}`);
  return { success: true, message };
}

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.conversation.findMany({
    where: {
      OR: [
        { participantOneId: session.user.id },
        { participantTwoId: session.user.id },
      ],
    },
    include: {
      shoePost: {
        select: { id: true, title: true, type: true },
      },
      participantOne: {
        select: { id: true, name: true, image: true },
      },
      participantTwo: {
        select: { id: true, name: true, image: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversationMessages(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      shoePost: { select: { id: true, title: true, type: true } },
      participantOne: { select: { id: true, name: true, image: true } },
      participantTwo: { select: { id: true, name: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!conversation) return null;

  const isParticipant =
    conversation.participantOneId === session.user.id ||
    conversation.participantTwoId === session.user.id;

  if (!isParticipant) return null;

  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return conversation;
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { participantOneId: session.user.id },
        { participantTwoId: session.user.id },
      ],
    },
    select: { id: true },
  });

  return db.message.count({
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: session.user.id },
      readAt: null,
    },
  });
}
