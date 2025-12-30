"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Rating, AssessmentStatus } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";

/**
 * Start or resume an assessment for a lacuna.
 * - If IN_PROGRESS assessment exists for (user, lacuna), return it
 * - Otherwise create a new one
 */
export async function startAssessmentAction(lacunaId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Check for existing IN_PROGRESS assessment
  const existingAssessment = await prisma.lacunaAssessment.findFirst({
    where: {
      userId: session.userId,
      lacunaId,
      status: AssessmentStatus.IN_PROGRESS,
    },
  });

  if (existingAssessment) {
    // Resume existing assessment
    redirect(`/assessments/${existingAssessment.id}`);
  }

  // Create new assessment
  const assessment = await prisma.lacunaAssessment.create({
    data: {
      userId: session.userId,
      lacunaId,
      status: AssessmentStatus.IN_PROGRESS,
    },
  });

  redirect(`/assessments/${assessment.id}`);
}

/**
 * Save a response for a sentence in an assessment
 * - User must own the assessment
 * - Assessment must be IN_PROGRESS
 */
export async function saveResponseAction(
  assessmentId: string,
  sentenceId: string,
  rating: Rating
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership and status
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
    throw new Error("Cannot modify a completed assessment");
  }

  // Save or update response
  const response = await prisma.assessmentResponse.upsert({
    where: {
      assessmentId_sentenceId: {
        assessmentId,
        sentenceId,
      },
    },
    update: {
      rating,
      answeredAt: new Date(),
    },
    create: {
      assessmentId,
      sentenceId,
      rating,
    },
  });

  return { success: true, response };
}

/**
 * Generate suggestions based on assessment responses
 * - Collect sentences rated RARELY or NEVER
 * - Order by lacuna → subvirtue priority
 */
async function generateSuggestions(assessmentId: string, lacunaId: string) {
  // Get all responses for this assessment rated RARELY or NEVER
  const lowRatedResponses = await prisma.assessmentResponse.findMany({
    where: {
      assessmentId,
      rating: {
        in: [Rating.RARELY, Rating.NEVER],
      },
    },
    include: {
      sentence: {
        include: {
          subVirtue: true,
        },
      },
    },
  });

  // Get lacuna's subvirtues with priority
  const lacunaSubVirtues = await prisma.lacunaSubVirtue.findMany({
    where: { lacunaId },
    orderBy: { priority: "asc" },
  });

  // Create a priority map
  const priorityMap = new Map(
    lacunaSubVirtues.map((lsv) => [lsv.subVirtueId, lsv.priority])
  );

  // Sort responses by subvirtue priority
  const sortedResponses = lowRatedResponses.sort((a, b) => {
    const priorityA = priorityMap.get(a.sentence.subVirtueId) || 999;
    const priorityB = priorityMap.get(b.sentence.subVirtueId) || 999;
    return priorityA - priorityB;
  });

  // Create suggestions
  const suggestions = await Promise.all(
    sortedResponses.map(async (response, index) => {
      return prisma.suggestedSentenceSnapshot.create({
        data: {
          assessmentId,
          sentenceId: response.sentenceId,
          priorityRank: index + 1,
          reason: `Rated ${response.rating} - needs cultivation of ${response.sentence.subVirtue.nameEn}`,
        },
      });
    })
  );

  return suggestions;
}

/**
 * Complete an assessment
 * - Mark as COMPLETED
 * - Generate suggestions
 * - Assessment becomes immutable
 */
export async function completeAssessmentAction(assessmentId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership and status
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
    throw new Error("Assessment is not in progress");
  }

  // Update assessment to COMPLETED
  const completedAssessment = await prisma.lacunaAssessment.update({
    where: { id: assessmentId },
    data: {
      status: AssessmentStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  // Generate suggestions
  await generateSuggestions(assessmentId, assessment.lacunaId);

  return completedAssessment;
}

/**
 * Get assessment details for display
 * - Includes lacuna info, subvirtues, sentences, and existing responses
 * - Also includes previous responses for each sentence from completed assessments
 */
export async function getAssessmentDetailsAction(assessmentId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      lacuna: {
        include: {
          lacunaSubVirtues: {
            include: {
              subVirtue: {
                include: {
                  sentences: true,
                },
              },
            },
            orderBy: { priority: "asc" },
          },
        },
      },
      responses: {
        include: {
          sentence: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // Verify ownership
  if (assessment.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Fetch previous responses for each sentence
  const allSentenceIds = assessment.lacuna.lacunaSubVirtues.flatMap((lsv) =>
    lsv.subVirtue.sentences.map((s) => s.id)
  );

  const previousResponses = await prisma.assessmentResponse.findMany({
    where: {
      sentenceId: {
        in: allSentenceIds,
      },
      assessment: {
        userId: session.userId,
        status: "COMPLETED",
        id: {
          not: assessmentId,
        },
      },
    },
    include: {
      assessment: {
        include: {
          lacuna: true,
        },
      },
    },
    orderBy: {
      assessment: {
        completedAt: "desc",
      },
    },
  });

  // Group previous responses by sentence ID
  const previousResponsesBysentenceId = new Map<string, typeof previousResponses>();
  previousResponses.forEach((response) => {
    if (!previousResponsesBysentenceId.has(response.sentenceId)) {
      previousResponsesBysentenceId.set(response.sentenceId, []);
    }
    previousResponsesBysentenceId.get(response.sentenceId)!.push(response);
  });

  return {
    ...assessment,
    previousResponsesBysentenceId,
  };
}
