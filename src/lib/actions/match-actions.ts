"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendMatchRequest(shoePostId: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const post = await db.shoePost.findUnique({
    where: { id: shoePostId },
    select: { userId: true, status: true },
  });

  if (!post) return { error: "Post not found" };
  if (post.userId === session.user.id) {
    return { error: "You cannot match your own listing" };
  }
  if (post.status !== "OPEN" && post.status !== "POTENTIAL_MATCH") {
    return { error: "This listing is no longer accepting matches" };
  }

  const existingRequest = await db.matchRequest.findUnique({
    where: {
      shoePostId_senderId: {
        shoePostId,
        senderId: session.user.id,
      },
    },
  });

  if (existingRequest) {
    return { error: "You already sent a match request for this listing" };
  }

  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: post.userId, blockedUserId: session.user.id },
        { blockerId: session.user.id, blockedUserId: post.userId },
      ],
    },
  });

  if (blocked) {
    return { error: "Unable to send match request" };
  }

  const [matchRequest, conversation] = await db.$transaction(async (tx) => {
    const mr = await tx.matchRequest.create({
      data: {
        shoePostId,
        senderId: session.user.id,
        receiverId: post.userId,
        initialMessage: message,
      },
    });

    const conv = await tx.conversation.create({
      data: {
        shoePostId,
        participantOneId: session.user.id,
        participantTwoId: post.userId,
        messages: {
          create: {
            senderId: session.user.id,
            body: message,
          },
        },
      },
    });

    await tx.shoePost.update({
      where: { id: shoePostId },
      data: { status: "POTENTIAL_MATCH" },
    });

    await tx.notification.create({
      data: {
        userId: post.userId,
        type: "NEW_MATCH_REQUEST",
        title: "New Match Request!",
        body: `Someone thinks they have the match for your shoe!`,
        data: { shoePostId, matchRequestId: mr.id },
      },
    });

    return [mr, conv];
  });

  revalidatePath(`/listings/${shoePostId}`);
  revalidatePath("/dashboard/messages");
  return { success: true, matchRequestId: matchRequest.id, conversationId: conversation.id };
}

export async function respondToMatchRequest(
  requestId: string,
  action: "ACCEPTED" | "REJECTED"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const request = await db.matchRequest.findUnique({
    where: { id: requestId },
    include: { shoePost: true },
  });

  if (!request || request.receiverId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.matchRequest.update({
    where: { id: requestId },
    data: { status: action },
  });

  await db.notification.create({
    data: {
      userId: request.senderId,
      type: "LISTING_STATUS_CHANGE",
      title: `Match Request ${action === "ACCEPTED" ? "Accepted" : "Declined"}`,
      body: `Your match request has been ${action.toLowerCase()}.`,
      data: { shoePostId: request.shoePostId, matchRequestId: request.id },
    },
  });

  revalidatePath("/dashboard/messages");
  return { success: true };
}

export async function confirmMatch(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const request = await db.matchRequest.findUnique({
    where: { id: requestId },
    include: { shoePost: true },
  });

  if (!request || request.receiverId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.$transaction([
    db.matchRequest.update({
      where: { id: requestId },
      data: { status: "CONFIRMED" },
    }),
    db.shoePost.update({
      where: { id: request.shoePostId },
      data: { status: "MATCHED" },
    }),
  ]);

  revalidatePath(`/listings/${request.shoePostId}`);
  revalidatePath("/dashboard/listings");
  return { success: true };
}
