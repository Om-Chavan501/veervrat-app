"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { VratmitraStatus } from "@/generated/prisma/enums";

/**
 * Invite a user as Vratmitra for a journey
 * - Only journey owner can invite
 * - Only one active Vratmitra per journey (pending or active)
 * - Creates new invitation record with PENDING status
 */
export async function inviteVratmitraAction(
  journeyId: string,
  inviteeEmail: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
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
    throw new Error("Unauthorized: Only journey owner can invite Vratmitra");
  }

  // Find the invitee by email
  const invitee = await prisma.user.findUnique({
    where: { email: inviteeEmail },
  });

  if (!invitee) {
    throw new Error("User with this email not found");
  }

  if (invitee.id === session.userId) {
    throw new Error("Cannot invite yourself as Vratmitra");
  }

  // Check if there's already an active or pending invitation
  const existingInvitation = await prisma.journeyVratmitra.findUnique({
    where: {
      journeyId_userId: {
        journeyId,
        userId: invitee.id,
      },
    },
  });

  if (existingInvitation) {
    if (existingInvitation.status === VratmitraStatus.ACTIVE) {
      throw new Error(
        "This user is already the active Vratmitra for this journey"
      );
    }
    if (existingInvitation.status === VratmitraStatus.PENDING) {
      throw new Error("Invitation already pending for this user");
    }
    // If detached, allow creating a new invitation
  }

  // Check if journey already has an active Vratmitra
  const activeVratmitra = await prisma.journeyVratmitra.findFirst({
    where: {
      journeyId,
      status: VratmitraStatus.ACTIVE,
    },
  });

  if (activeVratmitra) {
    throw new Error("Journey already has an active Vratmitra");
  }

  // Create invitation
  const invitation = await prisma.journeyVratmitra.create({
    data: {
      journeyId,
      userId: invitee.id,
      status: VratmitraStatus.PENDING,
    },
    include: {
      user: true,
      journey: {
        include: {
          sentence: true,
        },
      },
    },
  });

  return invitation;
}

/**
 * Accept Vratmitra invitation
 * - Only invitee can accept
 * - Changes status from PENDING to ACTIVE
 * - Sets acceptedAt timestamp
 */
export async function acceptVratmitraInvitationAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  // Find the invitation
  const invitation = await prisma.journeyVratmitra.findUnique({
    where: {
      journeyId_userId: {
        journeyId,
        userId: session.userId,
      },
    },
    include: {
      journey: {
        include: {
          sentence: true,
          user: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("No invitation found for this journey");
  }

  if (invitation.status !== VratmitraStatus.PENDING) {
    throw new Error(
      `Cannot accept invitation with status: ${invitation.status}`
    );
  }

  // Accept the invitation
  const updated = await prisma.journeyVratmitra.update({
    where: { id: invitation.id },
    data: {
      status: VratmitraStatus.ACTIVE,
      acceptedAt: new Date(),
    },
    include: {
      user: true,
      journey: {
        include: {
          sentence: true,
          user: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Detach Vratmitra from journey
 * - Either party can detach (journey owner or Vratmitra)
 * - Sets detachedAt timestamp but keeps record
 * - Does NOT delete the attachment record
 */
export async function detachVratmitraAction(journeyId: string, VratmitraId?: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  // Get journey
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  // Get the Vratmitra attachment to detach
  let attachment = await prisma.journeyVratmitra.findFirst({
    where: {
      journeyId,
      ...(VratmitraId ? { userId: VratmitraId } : { status: VratmitraStatus.ACTIVE }),
    },
  });

  if (!attachment) {
    throw new Error("Vratmitra attachment not found");
  }

  // Check authorization: either journey owner or the Vratmitra themselves
  const isJourneyOwner = journey.userId === session.userId;
  const isVratmitra = attachment.userId === session.userId;

  if (!isJourneyOwner && !isVratmitra) {
    throw new Error(
      "Unauthorized: Only journey owner or Vratmitra can detach"
    );
  }

  // Detach by setting detachedAt and status
  const updated = await prisma.journeyVratmitra.update({
    where: { id: attachment.id },
    data: {
      status: VratmitraStatus.DETACHED,
      detachedAt: new Date(),
    },
    include: {
      user: true,
      journey: {
        include: {
          sentence: true,
          user: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Get active Vratmitra for a journey
 * - Returns the currently active Vratmitra or null
 */
export async function getActiveVratmitraAction(journeyId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  // Verify journey exists
  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  // Get active Vratmitra
  const vratmitra = await prisma.journeyVratmitra.findFirst({
    where: {
      journeyId,
      status: VratmitraStatus.ACTIVE,
    },
    include: {
      user: true,
    },
  });

  return vratmitra || null;
}

/**
 * Get pending Vratmitra invitations for current user
 */
export async function getPendingInvitationsAction() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  const invitations = await prisma.journeyVratmitra.findMany({
    where: {
      userId: session.userId,
      status: VratmitraStatus.PENDING,
    },
    include: {
      journey: {
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
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
}
