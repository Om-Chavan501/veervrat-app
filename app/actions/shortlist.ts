"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Start a shortlist session for lacunae selection
 */
export async function startShortlistSessionAction() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Create a new shortlist session
  const session_record = await prisma.lacunaShortlistSession.create({
    data: {
      userId: session.userId,
    },
  });

  // Redirect to shortlist page
  redirect(`/lacunae/shortlist/${session_record.id}`);
}

/**
 * Add a lacuna to the shortlist
 */
export async function addToShortlistAction(
  sessionId: string,
  lacunaId: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership of shortlist session
  const shortlistSession = await prisma.lacunaShortlistSession.findUnique({
    where: { id: sessionId },
  });

  if (!shortlistSession) {
    throw new Error("Shortlist session not found");
  }

  if (shortlistSession.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Check if already in shortlist
  const existing = await prisma.lacunaShortlistItem.findUnique({
    where: {
      sessionId_lacunaId: {
        sessionId,
        lacunaId,
      },
    },
  });

  if (existing) {
    throw new Error("Already in shortlist");
  }

  // Get current max rank for this session
  const maxRank = await prisma.lacunaShortlistItem.findFirst({
    where: { sessionId },
    orderBy: { rank: "desc" },
    select: { rank: true },
  });

  const newRank = (maxRank?.rank || 0) + 1;

  // Add to shortlist
  const item = await prisma.lacunaShortlistItem.create({
    data: {
      sessionId,
      lacunaId,
      rank: newRank,
    },
  });

  return item;
}

/**
 * Remove a lacuna from the shortlist
 */
export async function removeFromShortlistAction(
  sessionId: string,
  lacunaId: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership of shortlist session
  const shortlistSession = await prisma.lacunaShortlistSession.findUnique({
    where: { id: sessionId },
  });

  if (!shortlistSession) {
    throw new Error("Shortlist session not found");
  }

  if (shortlistSession.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  // Remove from shortlist
  await prisma.lacunaShortlistItem.delete({
    where: {
      sessionId_lacunaId: {
        sessionId,
        lacunaId,
      },
    },
  });

  return { success: true };
}

/**
 * Get shortlist session with items
 */
export async function getShortlistSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const shortlistSession = await prisma.lacunaShortlistSession.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        include: {
          lacuna: true,
        },
        orderBy: { rank: "asc" },
      },
    },
  });

  if (!shortlistSession) {
    throw new Error("Shortlist session not found");
  }

  if (shortlistSession.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  return shortlistSession;
}

/**
 * Finalize shortlist session and start assessment for a selected lacuna
 */
export async function startAssessmentFromShortlistAction(
  sessionId: string,
  lacunaId: string
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Verify ownership and that lacuna is in shortlist
  const shortlistSession = await prisma.lacunaShortlistSession.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        select: { lacunaId: true },
      },
    },
  });

  if (!shortlistSession) {
    throw new Error("Shortlist session not found");
  }

  if (shortlistSession.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  const lacunaInShortlist = shortlistSession.items.some(
    (item) => item.lacunaId === lacunaId
  );

  if (!lacunaInShortlist) {
    throw new Error("Lacuna not in shortlist");
  }

  // Create assessment linked to this shortlist session
  const assessment = await prisma.lacunaAssessment.create({
    data: {
      userId: session.userId,
      lacunaId,
      status: "IN_PROGRESS",
      shortlistSessionId: sessionId,
    },
  });

  redirect(`/assessments/${assessment.id}`);
}
