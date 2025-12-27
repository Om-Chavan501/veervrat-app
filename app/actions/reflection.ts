"use server";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createReflectionAction(
  journeyId: string,
  data: {
    applied: boolean;
    contextNote: string;
    insightNote: string;
    difficulty: string | null;
  }
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify journey exists and user owns it
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Verify journey is ACTIVE
  if (journey.state !== "ACTIVE") {
    throw new Error("Journey is not active");
  }

  // Validate fields
  if (!data.contextNote.trim()) {
    throw new Error("Context is required");
  }

  if (!data.insightNote.trim()) {
    throw new Error("Insight gained is required");
  }

  // Check if reflection already exists for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingReflection = await prisma.dailyReflection.findFirst({
    where: {
      journeyId,
      date: {
        equals: today,
      },
    },
  });

  if (existingReflection) {
    throw new Error("Reflection already exists for today");
  }

  // Create reflection
  const reflection = await prisma.dailyReflection.create({
    data: {
      journeyId,
      date: today,
      applied: data.applied,
      contextNote: data.contextNote,
      insightNote: data.insightNote,
      difficulty: data.difficulty ? parseInt(data.difficulty) : null,
    },
  });

  return reflection;
}

export async function updateReflectionAction(
  reflectionId: string,
  data: {
    applied: boolean;
    contextNote: string;
    insightNote: string;
    difficulty: string | null;
  }
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get reflection
  const reflection = await prisma.dailyReflection.findUnique({
    where: { id: reflectionId },
    include: { journey: true },
  });

  if (!reflection) {
    throw new Error("Reflection not found");
  }

  // Verify ownership
  if (reflection.journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Check if reflection is from today (editable only same day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reflectionDate = new Date(reflection.date);
  reflectionDate.setHours(0, 0, 0, 0);

  if (reflectionDate.getTime() !== today.getTime()) {
    throw new Error("Cannot edit reflection from previous days");
  }

  // Validate fields
  if (!data.contextNote.trim()) {
    throw new Error("Context is required");
  }

  if (!data.insightNote.trim()) {
    throw new Error("Insight gained is required");
  }

  // Update reflection
  const updated = await prisma.dailyReflection.update({
    where: { id: reflectionId },
    data: {
      applied: data.applied,
      contextNote: data.contextNote,
      insightNote: data.insightNote,
      difficulty: data.difficulty ? parseInt(data.difficulty) : null,
    },
  });

  return updated;
}

export async function deleteReflectionAction(reflectionId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get reflection
  const reflection = await prisma.dailyReflection.findUnique({
    where: { id: reflectionId },
    include: { journey: true },
  });

  if (!reflection) {
    throw new Error("Reflection not found");
  }

  // Verify ownership
  if (reflection.journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Check if reflection is from today (deletable only same day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reflectionDate = new Date(reflection.date);
  reflectionDate.setHours(0, 0, 0, 0);

  if (reflectionDate.getTime() !== today.getTime()) {
    throw new Error("Cannot delete reflection from previous days");
  }

  // Delete reflection
  await prisma.dailyReflection.delete({
    where: { id: reflectionId },
  });
}

export async function getTodayReflectionAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify journey exists and user owns it
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Check if reflection exists for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reflection = await prisma.dailyReflection.findFirst({
    where: {
      journeyId,
      date: {
        equals: today,
      },
    },
  });

  return reflection;
}

export async function getReflectionsAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify journey exists and user owns it
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Get all reflections ordered by date (latest first)
  const reflections = await prisma.dailyReflection.findMany({
    where: { journeyId },
    orderBy: { date: "desc" },
  });

  return reflections;
}
