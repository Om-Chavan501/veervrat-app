"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { JourneyState, IrrationalBelief } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";

/**
 * Create a new SentenceJourney or link to existing one
 * - If no journey exists: create new journey (ACTIVE)
 * - If ACTIVE journey exists: redirect to clarification for this assessment
 * - If INACTIVE journey exists: redirect to journey page to offer resume/restart
 */
export async function createOrLinkJourneyAction(
  assessmentId: string,
  sentenceId: string
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify assessment exists and user owns it
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Verify sentence exists
  const sentence = await prisma.sentence.findUnique({
    where: { id: sentenceId },
  });

  if (!sentence) {
    throw new Error("Sentence not found");
  }

  // Check for existing journey
  let journey = await prisma.sentenceJourney.findUnique({
    where: {
      userId_sentenceId: {
        userId: session.userId,
        sentenceId,
      },
    },
  });

  if (!journey) {
    // Create new journey
    journey = await prisma.sentenceJourney.create({
      data: {
        userId: session.userId,
        sentenceId,
        state: JourneyState.ACTIVE,
      },
    });
  }

  // Redirect to clarification page
  redirect(`/journeys/${journey.id}/clarify/${assessmentId}`);
}

/**
 * Save clarification for a (Journey × Assessment) link
 * Creates or updates SentenceJourneyAssessmentLink
 */
export async function saveClarificationAction(
  journeyId: string,
  assessmentId: string,
  clarification: {
    virtueRelationNote: string;
    lacunaReductionNote: string;
    unifiedInsightNote: string;
    personalContextNote: string;
    irrationalBelief: IrrationalBelief;
  }
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify journey exists and user owns it
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
    include: { user: true },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Verify assessment exists and user owns it
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Validate clarification fields
  if (
    !clarification.lacunaReductionNote ||
    !clarification.unifiedInsightNote ||
    !clarification.personalContextNote
  ) {
    throw new Error("All clarification fields are required");
  }

  // Save or update clarification link
  const link = await prisma.sentenceJourneyAssessmentLink.upsert({
    where: {
      journeyId_assessmentId: {
        journeyId,
        assessmentId,
      },
    },
    update: {
      virtueRelationNote: clarification.virtueRelationNote,
      lacunaReductionNote: clarification.lacunaReductionNote,
      unifiedInsightNote: clarification.unifiedInsightNote,
      personalContextNote: clarification.personalContextNote,
      irrationalBelief: clarification.irrationalBelief,
    },
    create: {
      journeyId,
      assessmentId,
      virtueRelationNote: clarification.virtueRelationNote,
      lacunaReductionNote: clarification.lacunaReductionNote,
      unifiedInsightNote: clarification.unifiedInsightNote,
      personalContextNote: clarification.personalContextNote,
      irrationalBelief: clarification.irrationalBelief,
    },
  });

  return link;
}

/**
 * Add a resolution to a journey
 * Only allowed if journey is ACTIVE and has at least one clarification
 */
export async function addResolutionAction(
  journeyId: string,
  text: string,
  frequency: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!text || !frequency) {
    throw new Error("Text and frequency are required");
  }

  // Verify journey exists, user owns it, and it's ACTIVE
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
    include: {
      links: true,
    },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (journey.state !== JourneyState.ACTIVE) {
    throw new Error("Cannot add resolutions to inactive journey");
  }

  // Check that at least one clarification exists
  if (journey.links.length === 0) {
    throw new Error(
      "Must complete clarification before adding resolutions"
    );
  }

  // Create resolution
  const resolution = await prisma.resolutionInstance.create({
    data: {
      journeyId,
      text,
      frequency,
    },
  });

  return resolution;
}

/**
 * Update an existing resolution
 * Only if journey is ACTIVE
 */
export async function updateResolutionAction(
  resolutionId: string,
  text: string,
  frequency: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!text || !frequency) {
    throw new Error("Text and frequency are required");
  }

  // Verify resolution exists
  const resolution = await prisma.resolutionInstance.findUnique({
    where: { id: resolutionId },
    include: {
      journey: true,
    },
  });

  if (!resolution) {
    throw new Error("Resolution not found");
  }

  // Verify ownership and journey is ACTIVE
  if (resolution.journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (resolution.journey.state !== JourneyState.ACTIVE) {
    throw new Error("Cannot edit resolutions on inactive journey");
  }

  // Update resolution
  const updated = await prisma.resolutionInstance.update({
    where: { id: resolutionId },
    data: { text, frequency },
  });

  return updated;
}

/**
 * Delete a resolution
 * Only if journey is ACTIVE
 */
export async function deleteResolutionAction(resolutionId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify resolution exists
  const resolution = await prisma.resolutionInstance.findUnique({
    where: { id: resolutionId },
    include: {
      journey: true,
    },
  });

  if (!resolution) {
    throw new Error("Resolution not found");
  }

  // Verify ownership and journey is ACTIVE
  if (resolution.journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (resolution.journey.state !== JourneyState.ACTIVE) {
    throw new Error("Cannot delete resolutions from inactive journey");
  }

  // Delete resolution
  await prisma.resolutionInstance.delete({
    where: { id: resolutionId },
  });

  return { success: true };
}

/**
 * Pause a journey (ACTIVE → INACTIVE)
 */
export async function pauseJourneyAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (journey.state !== JourneyState.ACTIVE) {
    throw new Error("Can only pause active journeys");
  }

  const updated = await prisma.sentenceJourney.update({
    where: { id: journeyId },
    data: {
      state: JourneyState.INACTIVE,
      inactiveAt: new Date(),
    },
  });

  return updated;
}

/**
 * Resume a journey (INACTIVE → ACTIVE)
 */
export async function resumeJourneyAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (journey.state !== JourneyState.INACTIVE) {
    throw new Error("Can only resume inactive journeys");
  }

  const updated = await prisma.sentenceJourney.update({
    where: { id: journeyId },
    data: {
      state: JourneyState.ACTIVE,
      inactiveAt: null,
      inactiveReason: null,
    },
  });

  return updated;
}

/**
 * Complete a journey (ACTIVE → COMPLETED)
 * Cannot complete from INACTIVE
 */
export async function completeJourneyAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (journey.state !== JourneyState.ACTIVE) {
    throw new Error("Can only complete active journeys");
  }

  const updated = await prisma.sentenceJourney.update({
    where: { id: journeyId },
    data: {
      state: JourneyState.COMPLETED,
    },
  });

  return updated;
}

/**
 * Get journey details for display
 */
export async function getJourneyDetailsAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
    include: {
      sentence: {
        include: {
          subVirtue: {
            include: {
              virtue: true,
            },
          },
        },
      },
      links: {
        include: {
          assessment: {
            include: {
              lacuna: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      resolutions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  return journey;
}
