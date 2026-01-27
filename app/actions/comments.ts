"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VratmitraStatus } from "@/generated/prisma/enums";

async function assertCanViewJourney(journeyId: string, userId: string) {
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
    select: {
      userId: true,
      vratmitras: {
        where: { status: VratmitraStatus.ACTIVE, userId },
        select: { id: true },
      },
    },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  const isOwner = journey.userId === userId;
  const isVratmitra = journey.vratmitras.length > 0;

  if (!isOwner && !isVratmitra) {
    throw new Error("Unauthorized");
  }

  return { isOwner, isVratmitra };
}

export async function addCommentAction(reflectionId: string, text: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!text.trim()) {
    throw new Error("Comment cannot be empty");
  }

  const reflection = await prisma.dailyReflection.findUnique({
    where: { id: reflectionId },
    select: { journeyId: true },
  });

  if (!reflection) throw new Error("Reflection not found");

  await assertCanViewJourney(reflection.journeyId, session.userId);

  const comment = await prisma.reflectionComment.create({
    data: {
      reflectionId,
      userId: session.userId,
      text: text.trim(),
    },
    include: {
      user: true,
    },
  });

  return comment;
}

export async function deleteCommentAction(commentId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const comment = await prisma.reflectionComment.findUnique({
    where: { id: commentId },
    include: {
      reflection: { select: { journeyId: true } },
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.userId !== session.userId) {
    throw new Error("You can only delete your own comments");
  }

  await assertCanViewJourney(comment.reflection.journeyId, session.userId);

  await prisma.reflectionComment.delete({ where: { id: commentId } });
  return { success: true };
}
