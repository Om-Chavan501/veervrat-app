"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Add an exposure to a journey
 * - Only journey owner can add
 * - No frequency, no state, no enforcement
 */
export async function addExposureAction(
  journeyId: string,
  data: {
    description: string;
    contextNote?: string;
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
    throw new Error("Unauthorized: Only journey owner can add exposures");
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    throw new Error("Description is required");
  }

  // Create exposure
  const exposure = await prisma.exposureInstance.create({
    data: {
      journeyId,
      description: data.description.trim(),
      contextNote: data.contextNote?.trim() || null,
    },
  });

  return exposure;
}

/**
 * Update an exposure
 * - Only journey owner can edit
 */
export async function updateExposureAction(
  exposureId: string,
  data: {
    description: string;
    contextNote?: string;
  }
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get exposure with journey to verify ownership
  const exposure = await prisma.exposureInstance.findUnique({
    where: { id: exposureId },
    include: { journey: true },
  });

  if (!exposure) {
    throw new Error("Exposure not found");
  }

  if (exposure.journey.userId !== session.userId) {
    throw new Error("Unauthorized: Only journey owner can edit exposures");
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    throw new Error("Description is required");
  }

  // Update exposure
  const updated = await prisma.exposureInstance.update({
    where: { id: exposureId },
    data: {
      description: data.description.trim(),
      contextNote: data.contextNote?.trim() || null,
    },
  });

  return updated;
}

/**
 * Delete an exposure
 * - Only journey owner can delete
 */
export async function deleteExposureAction(exposureId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get exposure with journey to verify ownership
  const exposure = await prisma.exposureInstance.findUnique({
    where: { id: exposureId },
    include: { journey: true },
  });

  if (!exposure) {
    throw new Error("Exposure not found");
  }

  if (exposure.journey.userId !== session.userId) {
    throw new Error("Unauthorized: Only journey owner can delete exposures");
  }

  // Delete exposure
  await prisma.exposureInstance.delete({
    where: { id: exposureId },
  });

  return { success: true };
}

/**
 * Get exposures for a journey
 * - Owner and active Vratmitra can view
 * - Returns exposures in reverse chronological order (newest first)
 */
export async function getExposuresAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify journey exists
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  // Check if user is owner or active Vratmitra
  const isOwner = journey.userId === session.userId;
  
  if (!isOwner) {
    // Check if user is active Vratmitra
    const vratmitra = await prisma.journeyVratmitra.findFirst({
      where: {
        journeyId,
        userId: session.userId,
        status: "ACTIVE",
      },
    });

    if (!vratmitra) {
      throw new Error(
        "Unauthorized: Only journey owner or active Vratmitra can view exposures"
      );
    }
  }

  // Get exposures
  const exposures = await prisma.exposureInstance.findMany({
    where: { journeyId },
    orderBy: { createdAt: "desc" },
  });

  return exposures;
}
