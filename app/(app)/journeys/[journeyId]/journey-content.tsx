"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  pauseJourneyAction,
  resumeJourneyAction,
  completeJourneyAction,
} from "@/app/actions/journey";
import Link from "next/link";

interface Journey {
  id: string;
  state: "ACTIVE" | "INACTIVE" | "COMPLETED";
  sentence: {
    textEn: string;
    textMr: string;
    subVirtue: {
      nameEn: string;
    };
  };
  links: Array<{
    id: string;
    assessmentId: string;
    virtueRelationNote: string | null;
    lacunaReductionNote: string | null;
    unifiedInsightNote: string | null;
    personalContextNote: string | null;
    irrationalBelief: string | null;
    assessment: {
      id: string;
      lacuna: {
        nameEn: string;
        nameMr: string;
      };
    };
  }>;
  resolutions: Array<{
    id: string;
    text: string;
    frequency: string;
    createdAt: Date;
  }>;
}

export function JourneyContent({
  journey,
  userId,
}: {
  journey: Journey;
  userId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to pause journey:", error);
      alert("Failed to pause journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      await resumeJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to resume journey:", error);
      alert("Failed to resume journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (
      !confirm(
        "Mark this journey as completed? You can still view it, but won't be able to edit it."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await completeJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete journey:", error);
      alert("Failed to complete journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasClarifications = journey.links.some(
    (link) =>
      link.virtueRelationNote ||
      link.lacunaReductionNote ||
      link.unifiedInsightNote ||
      link.personalContextNote ||
      link.irrationalBelief
  );

  return (
    <div className="space-y-8">
      {/* Clarifications Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Understanding This Sentence
          </h3>
          <p className="text-sm text-gray-600">
            {journey.links.length} assessment
            {journey.links.length !== 1 ? "s" : ""}
          </p>
        </div>

        {journey.links.length === 0 ? (
          <p className="text-gray-600">
            No assessments linked yet. Complete an assessment to add context.
          </p>
        ) : (
          <div className="space-y-6">
            {journey.links.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-4">
                  {link.assessment.lacuna.nameEn}
                </h4>

                {!link.virtueRelationNote && !link.irrationalBelief ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <p className="text-sm text-yellow-800 font-medium mb-3">
                      Complete your clarification to unlock resolutions
                    </p>
                    <Link
                      href={`/journeys/${journey.id}/clarify/${link.assessmentId}`}
                      className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition font-medium text-sm"
                    >
                      Complete Clarification
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {link.virtueRelationNote && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          How This Sentence Relates to Your Inner Work
                        </p>
                        <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded">
                          {link.virtueRelationNote}
                        </p>
                      </div>
                    )}
                    {link.lacunaReductionNote && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          How Developing This Virtue Reduces the Lacuna
                        </p>
                        <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded">
                          {link.lacunaReductionNote}
                        </p>
                      </div>
                    )}
                    {link.unifiedInsightNote && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          Your Unified Insight
                        </p>
                        <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded">
                          {link.unifiedInsightNote}
                        </p>
                      </div>
                    )}
                    {link.personalContextNote && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          Personal Context
                        </p>
                        <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded">
                          {link.personalContextNote}
                        </p>
                      </div>
                    )}
                    {link.irrationalBelief && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          Core Irrational Belief
                        </p>
                        <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded font-medium">
                          {link.irrationalBelief}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href={`/journeys/${journey.id}/clarify/${link.assessmentId}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {link.virtueRelationNote ? "Edit" : "Add"} Clarification →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resolutions Section */}
      {journey.state === "ACTIVE" && hasClarifications && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Your Resolutions
            </h3>
            <p className="text-sm text-gray-600">
              {journey.resolutions.length} resolution
              {journey.resolutions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {journey.resolutions.length === 0 ? (
            <p className="text-gray-600 mb-4">
              You haven't added any resolutions yet. Start with one practice.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {journey.resolutions.map((resolution) => (
                <div key={resolution.id} className="border border-gray-200 rounded p-3">
                  <p className="font-medium text-gray-900 mb-1">{resolution.text}</p>
                  <p className="text-xs text-gray-600">
                    Frequency: <span className="font-medium">{resolution.frequency}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/journeys/${journey.id}/resolutions`}
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-medium"
          >
            {journey.resolutions.length === 0
              ? "+ Add Your First Resolution"
              : "+ Add Another Resolution"}
          </Link>
        </section>
      )}

      {/* State Actions */}
      <section className="flex gap-4 justify-center">
        {journey.state === "ACTIVE" && (
          <>
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="px-6 py-3 border border-yellow-600 text-yellow-600 rounded font-medium hover:bg-yellow-50 transition disabled:opacity-50"
            >
              {isLoading ? "Pausing..." : "Pause Journey"}
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="px-6 py-3 border border-green-600 text-green-600 rounded font-medium hover:bg-green-50 transition disabled:opacity-50"
            >
              {isLoading ? "Completing..." : "Mark as Completed"}
            </button>
          </>
        )}

        {journey.state === "INACTIVE" && (
          <button
            onClick={handleResume}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Resuming..." : "Resume Journey"}
          </button>
        )}

        {journey.state === "COMPLETED" && (
          <p className="text-gray-600 italic">
            This journey is complete. You can still view it and all your notes.
          </p>
        )}
      </section>
    </div>
  );
}
