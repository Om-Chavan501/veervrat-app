"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAssessmentDetailsAction,
  saveResponseAction,
  completeAssessmentAction,
  deleteResponseAction,
} from "@/app/actions/assessment";
import type { Rating } from "@/generated/prisma/enums";

interface AssessmentPageProps {
  params: Promise<{ assessmentId: string }>;
}

type AssessmentDetails = Awaited<ReturnType<typeof getAssessmentDetailsAction>>;

interface PreviousResponse {
  rating: Rating;
  lacunaName: string;
  completedDate: Date;
}

export default function AssessmentPage(props: AssessmentPageProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ assessmentId: string } | null>(null);
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentRatings, setCurrentRatings] = useState<Map<string, Rating>>(
    new Map()
  );
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  useEffect(() => {
    if (!params) return;

    const loadAssessment = async () => {
      try {
        const data = await getAssessmentDetailsAction(params.assessmentId);
        setAssessment(data);

        // Initialize current ratings from responses
        const ratings = new Map<string, Rating>();
        data.responses.forEach((response) => {
          ratings.set(response.sentenceId, response.rating);
        });
        setCurrentRatings(ratings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load assessment"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [params]);

  const handleRating = async (sentenceId: string, rating: Rating) => {
    try {
      setSaving(true);
      const currentRating = currentRatings.get(sentenceId);

      // If clicking the same rating, deselect it
      if (currentRating === rating) {
        await deleteResponseAction(params!.assessmentId, sentenceId);
        setCurrentRatings((prev) => {
          const newMap = new Map(prev);
          newMap.delete(sentenceId);
          return newMap;
        });
      } else {
        // Otherwise, save the new rating
        await saveResponseAction(params!.assessmentId, sentenceId, rating);
        setCurrentRatings((prev) => new Map(prev).set(sentenceId, rating));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save response"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAssessment = async () => {
    setShowCompletionModal(true);
  };

  const handleConfirmCompletion = async () => {
    try {
      setCompleting(true);
      await completeAssessmentAction(params!.assessmentId);
      // Redirect to results page
      router.push(`/assessment-results/${params!.assessmentId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete assessment"
      );
      setCompleting(false);
      setShowCompletionModal(false);
    }
  };

  const closeTooltip = useCallback(() => {
    setActiveTooltipId(null);
  }, []);

  // Click/touch outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        closeTooltip();
      }
    };

    if (activeTooltipId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [activeTooltipId, closeTooltip]);

  const openTooltip = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, sentenceId: string) => {
      // Capture element synchronously to avoid currentTarget becoming null later. [web:42][web:45]
      const el = e.currentTarget as HTMLDivElement | null;
      if (!el) return;

      // Toggle off if clicking same sentence again
      setActiveTooltipId((prev) => {
        const willBeOpen = prev !== sentenceId;
        if (!willBeOpen) {
          return null;
        }

        const rect = el.getBoundingClientRect();

        // Click / tap coordinates
        const clickX = e.clientX || rect.left + rect.width / 2;
        const clickY = e.clientY || rect.top + rect.height / 2;

        const tooltipWidth = 320; // w-80
        const tooltipHeight = 260; // approximate max height
        const padding = 8;

        let top = clickY + 8 + window.scrollY; // default below click
        let left = clickX - tooltipWidth / 2 + window.scrollX;

        // Clamp horizontally within viewport. [web:21][web:50]
        const maxLeft = window.innerWidth - tooltipWidth - padding;
        if (left < padding) left = padding;
        if (left > maxLeft) left = maxLeft;

        // If going below viewport, flip above trigger. [web:21]
        const viewportBottom = window.scrollY + window.innerHeight;
        if (top + tooltipHeight > viewportBottom - padding) {
          top = rect.top + window.scrollY - tooltipHeight - 8;
        }

        setTooltipPosition({ top, left });

        return sentenceId;
      });
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center text-gray-600">
        <p>Assessment not found</p>
      </div>
    );
  }

  const isCompleted = assessment.status === "COMPLETED";
  const totalSentences = assessment.lacuna.lacunaSubVirtues.reduce(
    (sum, lsv) => sum + lsv.subVirtue.sentences.length,
    0
  );
  const answeredCount = currentRatings.size;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {assessment.lacuna.nameEn}
        </h2>
        <p className="text-gray-600">{assessment.lacuna.nameMr}</p>

        <div className="mt-4 bg-gray-100 rounded p-3">
          <p className="text-sm text-gray-700">
            Progress: <span className="font-bold">{answeredCount}</span> of{" "}
            <span className="font-bold">{totalSentences}</span> sentences
            answered
          </p>
          {isCompleted && (
            <p className="text-sm text-green-700 font-medium mt-1">
              ✓ Assessment completed
            </p>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            This assessment is complete and cannot be edited.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {assessment.lacuna.lacunaSubVirtues.map((lacunaSubVirtue) => (
          <section
            key={lacunaSubVirtue.id}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {lacunaSubVirtue.subVirtue.nameEn}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {lacunaSubVirtue.subVirtue.nameMr}
            </p>

            <div className="space-y-4">
              {lacunaSubVirtue.subVirtue.sentences.map((sentence) => {
                const currentRating = currentRatings.get(sentence.id);
                const previousResponses =
                  assessment.previousResponsesBysentenceId?.get(sentence.id) ||
                  [];
                const hasPreviousResponses = previousResponses.length > 0;

                return (
                  <div
                    key={sentence.id}
                    className="border border-gray-200 rounded p-4 relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm text-gray-800 font-medium flex-1">
                        {sentence.textEn}
                      </p>
                      {hasPreviousResponses && (
                        <div
                          className="relative ml-2 flex-shrink-0 cursor-pointer"
                          onClick={(e) => openTooltip(e, sentence.id)}
                        >
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                            Solved Before
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      {sentence.textMr}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      {(["ALWAYS", "OFTEN", "RARELY", "NEVER"] as const).map(
                        (ratingValue) => (
                          <button
                            key={ratingValue}
                            onClick={() =>
                              !isCompleted &&
                              handleRating(sentence.id, ratingValue as Rating)
                            }
                            disabled={isCompleted || saving}
                            className={`px-3 py-2 rounded text-sm font-medium transition ${
                              currentRating === ratingValue
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } ${
                              isCompleted
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {ratingValue}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {!isCompleted && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleCompleteAssessment}
            disabled={completing || answeredCount === 0}
            className={`px-6 py-3 rounded font-medium transition ${
              answeredCount === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {completing ? "Completing..." : "Complete Assessment"}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-8 flex justify-end">
          <a
            href={`/assessment-results/${assessment.id}`}
            className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
          >
            View Results
          </a>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Complete Assessment?
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-bold">{answeredCount}</span> out of{" "}
                <span className="font-bold">{totalSentences}</span> sentences
                have been answered.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                ℹ️ You must answer at least one sentence to proceed. Answering
                all sentences is not mandatory.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmCompletion}
                disabled={completing}
                className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? "Completing..." : "Yes, Complete Assessment"}
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                disabled={completing}
                className="w-full bg-gray-200 text-gray-900 py-2 rounded font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent, mobile-friendly tooltip */}
      {activeTooltipId && assessment && (
        <div
          ref={tooltipRef}
          className="fixed bg-gray-900 text-white text-xs rounded-lg shadow-xl p-4 z-[1000] w-80 max-w-[90vw] border border-gray-700"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">Previous Responses:</p>
            <button
              onClick={closeTooltip}
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1 transition-all"
              aria-label="Close tooltip"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {assessment.previousResponsesBysentenceId?.get(
              activeTooltipId
            )?.length ? (
              assessment.previousResponsesBysentenceId
                ?.get(activeTooltipId)
                ?.map((prevResp, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`font-bold text-sm ${
                          prevResp.rating === "ALWAYS"
                            ? "text-green-400"
                            : prevResp.rating === "OFTEN"
                            ? "text-blue-400"
                            : prevResp.rating === "RARELY"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {prevResp.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        {prevResp.assessment.completedAt?.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs">
                      <span className="font-medium">Lacuna:</span>{" "}
                      {prevResp.assessment.lacuna.nameEn}
                    </p>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-xs italic">
                No previous responses found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
