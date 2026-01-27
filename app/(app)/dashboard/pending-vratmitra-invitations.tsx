"use client";

import { useEffect, useState } from "react";
import { getPendingInvitationsAction, acceptVratmitraInvitationAction, detachVratmitraAction } from "@/app/actions/vratmitra";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { JourneyVratmitra } from "@/generated/prisma/client";

interface PendingInvitation extends JourneyVratmitra {
  journey: {
    id: string;
    sentence: {
      textEn: string;
      textMr: string;
      subVirtue: {
        nameEn: string;
        virtue: {
          nameEn: string;
        };
      };
    };
    user: {
      id: string;
      name: string;
      email: string | null;
    };
  };
}

export function PendingVratmitraInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const result = await getPendingInvitationsAction();
      setInvitations(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load invitations";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (journeyId: string) => {
    setProcessingId(journeyId);
    setMessage(null);

    try {
      await acceptVratmitraInvitationAction(journeyId);
      setMessage({
        type: "success",
        text: "Invitation accepted!",
      });
      // Reload invitations
      await loadInvitations();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to accept invitation";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (journeyId: string) => {
    if (!window.confirm("Are you sure you want to decline this invitation?")) {
      return;
    }

    setProcessingId(journeyId);
    setMessage(null);

    try {
      await detachVratmitraAction(journeyId);
      setMessage({
        type: "success",
        text: "Invitation declined.",
      });
      // Reload invitations
      await loadInvitations();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to decline invitation";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading invitations...</div>;
  }

  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<HandsIcon />}
        title="No companion invitations"
        description="Vratmitras offer read-only support for your journey. You can invite them later."
      />
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.userId + invitation.journeyId}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">
                    {invitation.journey.user.name}
                  </h4>
                  <span className="text-sm text-gray-600">
                    invited you as Vratmitra
                  </span>
                </div>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {invitation.journey.sentence.textEn}
                </p>
                <p className="text-sm text-gray-600">
                  {invitation.journey.sentence.textMr}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  <span className="font-medium">
                    {invitation.journey.sentence.subVirtue.nameEn}
                  </span>
                  {" • "}
                  <span>
                    {invitation.journey.sentence.subVirtue.virtue.nameEn}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 whitespace-nowrap">
                <button
                  onClick={() => handleAccept(invitation.journey.id)}
                  disabled={processingId === invitation.journey.id}
                  className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                >
                  {processingId === invitation.journey.id ? "..." : "Accept"}
                </button>
                <button
                  onClick={() => handleReject(invitation.journey.id)}
                  disabled={processingId === invitation.journey.id}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {processingId === invitation.journey.id ? "..." : "Decline"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11V6.5a2.5 2.5 0 0 0-5 0V12a7 7 0 0 0 7 7h1" strokeLinecap="round" />
      <path d="M15 11V6.5a2.5 2.5 0 0 1 5 0V12a7 7 0 0 1-7 7h-1" strokeLinecap="round" />
    </svg>
  );
}
