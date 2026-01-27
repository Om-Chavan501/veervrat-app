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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssessmentPageProps {
  params: Promise<{ assessmentId: string }>;
}

type AssessmentDetails = Awaited<ReturnType<typeof getAssessmentDetailsAction>>;

export default function AssessmentPage(props: AssessmentPageProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ assessmentId: string } | null>(null);
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentRatings, setCurrentRatings] = useState<Map<string, Rating>>(new Map());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{ answered: number; total: number } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [skipPulse, setSkipPulse] = useState(false);

  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const sentenceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  useEffect(() => {
    if (!params) return;

    const loadAssessment = async () => {
      try {
        const data = await getAssessmentDetailsAction(params.assessmentId);
        setAssessment(data);

        const ratings = new Map<string, Rating>();
        data.responses.forEach((response) => {
          ratings.set(response.sentenceId, response.rating);
        });
        setCurrentRatings(ratings);

        const sectionState: Record<string, boolean> = {};
        data.lacuna.lacunaSubVirtues.forEach((lsv) => {
          sectionState[lsv.id] = true;
        });
        setExpandedSections(sectionState);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [params]);

  const resetSkipPulse = useCallback(() => {
    setSkipPulse(false);
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = setTimeout(() => setSkipPulse(true), 30000);
  }, []);

  useEffect(() => {
    resetSkipPulse();
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, [resetSkipPulse]);

  const handleRating = async (sentenceId: string, rating: Rating) => {
    try {
      setSaving(true);
      const currentRating = currentRatings.get(sentenceId);

      if (currentRating === rating) {
        await deleteResponseAction(params!.assessmentId, sentenceId);
        setCurrentRatings((prev) => {
          const newMap = new Map(prev);
          newMap.delete(sentenceId);
          return newMap;
        });
      } else {
        await saveResponseAction(params!.assessmentId, sentenceId, rating);
        setCurrentRatings((prev) => new Map(prev).set(sentenceId, rating));
      }

      setToast("Response saved");
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
      resetSkipPulse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save response");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAssessment = async () => {
    try {
      setCompleting(true);
      await completeAssessmentAction(params!.assessmentId);
      setCompletionData({
        answered: currentRatings.size,
        total: assessment?.lacuna.lacunaSubVirtues.reduce(
          (sum, lsv) => sum + lsv.subVirtue.sentences.length,
          0
        ) ?? 0,
      });
      setAssessment((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
      setShowCompletionModal(true);
      setCompleting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete assessment");
      setCompleting(false);
    }
  };

  const closeTooltip = useCallback(() => {
    setActiveTooltipId(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
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
      const el = e.currentTarget as HTMLDivElement | null;
      if (!el) return;

      setActiveTooltipId((prev) => {
        const willBeOpen = prev !== sentenceId;
        if (!willBeOpen) return null;

        const rect = el.getBoundingClientRect();

        const clickX = e.clientX || rect.left + rect.width / 2;
        const clickY = e.clientY || rect.top + rect.height / 2;

        const tooltipWidth = 320;
        const tooltipHeight = 260;
        const padding = 8;

        let top = clickY + 8 + window.scrollY;
        let left = clickX - tooltipWidth / 2 + window.scrollX;

        const maxLeft = window.innerWidth - tooltipWidth - padding;
        if (left < padding) left = padding;
        if (left > maxLeft) left = maxLeft;

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

  const handleSkipToNext = () => {
    if (!assessment) return;
    const allSentences = assessment.lacuna.lacunaSubVirtues.flatMap((lsv) => lsv.subVirtue.sentences);
    const nextUnanswered = allSentences.find((sentence) => !currentRatings.has(sentence.id));
    if (nextUnanswered) {
      const target = sentenceRefs.current[nextUnanswered.id];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
    } else {
      setToast("All sentences are answered");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 p-4 rounded">
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
  const completionPercent = Math.round((answeredCount / totalSentences) * 100);
  const remaining = totalSentences - answeredCount;

  return (
    <div className="space-y-6">
      <div className="card shadow-soft">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">Assessment</p>
            <h2 className="text-3xl font-bold text-[#2c2c2c]">{assessment.lacuna.nameEn}</h2>
            <p className="text-sm text-[#6b6b6b]">{assessment.lacuna.nameMr}</p>
          </div>
          <div className="w-full max-w-md space-y-2 rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#2c2c2c]">Progress</span>
              <span className="text-[#6b6b6b]">
                {answeredCount}/{totalSentences}
              </span>
            </div>
            <Progress value={completionPercent} />
            <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
              <span>{completionPercent}% complete</span>
              <Badge tone={isCompleted ? "completed" : "info"}>
                {isCompleted ? "Completed" : "In progress"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {isCompleted && (
        <div className="rounded-[14px] border border-[#d8d1c6] bg-[#faf6ef] p-4 text-sm text-[#6b6b6b]">
          This assessment is complete and cannot be edited.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="subtle"
          onClick={handleSkipToNext}
          disabled={isCompleted}
          className={skipPulse && !isCompleted ? "animate-pulse" : ""}
        >
          {remaining > 0
            ? `Skip to Next Unanswered (${remaining} remaining)`
            : "Review All Responses"}
        </Button>
        <p className="text-xs text-[#6b6b6b]">
          Highlighted cards are unanswered. Saved responses glow in green.
        </p>
      </div>

      <div className="space-y-4">
        {assessment.lacuna.lacunaSubVirtues.map((lacunaSubVirtue) => (
          <section
            key={lacunaSubVirtue.id}
            className="rounded-[16px] border border-[#e5e5e5] bg-white/90 p-5 shadow-card"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  [lacunaSubVirtue.id]: !prev[lacunaSubVirtue.id],
                }))
              }
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <h3 className="text-xl font-bold text-[#2c2c2c]">
                  {lacunaSubVirtue.subVirtue.nameEn}
                </h3>
                <p className="text-sm text-[#6b6b6b]">{lacunaSubVirtue.subVirtue.nameMr}</p>
              </div>
              <Badge tone="info">
                {expandedSections[lacunaSubVirtue.id] ? "Hide" : "Show"} sentences
              </Badge>
            </button>

            {expandedSections[lacunaSubVirtue.id] && (
              <div className="mt-4 space-y-4">
                {lacunaSubVirtue.subVirtue.sentences.map((sentence) => {
                  const currentRating = currentRatings.get(sentence.id);
                  const previousResponses =
                    assessment.previousResponsesBysentenceId?.get(sentence.id) || [];
                  const hasPreviousResponses = previousResponses.length > 0;

                  return (
                    <div
                      key={sentence.id}
                      ref={(el) => {
                        sentenceRefs.current[sentence.id] = el;
                      }}
                      tabIndex={-1}
                      className={`relative rounded-[14px] border p-4 shadow-inner transition ${
                        currentRating
                          ? "border-[#c9d8bd] bg-[#f7f4ed]"
                          : "border-[#d8d1c6] bg-[#fffdfa] shadow-[0_0_0_4px_rgba(196,123,92,0.12)]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-[#2c2c2c] font-semibold">
                            {sentence.textEn}
                          </p>
                          <p className="text-xs text-[#6b6b6b]">{sentence.textMr}</p>
                        </div>
                        {hasPreviousResponses && (
                          <div
                            className="relative ml-2 flex-shrink-0 cursor-pointer"
                            onClick={(e) => openTooltip(e, sentence.id)}
                          >
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2fd] px-3 py-1 text-xs font-semibold text-[#1c64b0] hover:bg-[#d7e6f7] transition-colors">
                              <span className="status-dot bg-[#1c64b0]" />
                              Seen before
                            </span>
                          </div>
                        )}
                      </div>

                    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-2">
                      {(["ALWAYS", "OFTEN", "RARELY", "NEVER"] as const).map((ratingValue) => (
                        <Button
                          key={ratingValue}
                          size="sm"
                          variant={currentRating === ratingValue ? "primary" : "outline"}
                          onClick={() =>
                            !isCompleted && handleRating(sentence.id, ratingValue as Rating)
                          }
                          disabled={isCompleted || saving}
                          className="min-w-[120px] sm:min-w-[88px] min-h-[48px]"
                          icon={
                            currentRating === ratingValue ? (
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : undefined
                          }
                        >
                          {ratingValue}
                        </Button>
                      ))}
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-[#e5e5e5] bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2c2c2c]">
              {answeredCount} of {totalSentences} answered
            </p>
            <p className="text-xs text-[#6b6b6b]">
              You can save and exit anytime. Completion needs at least one answer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} disabled={saving}>
              Save &amp; Exit
            </Button>
            {isCompleted ? (
              <Button asChild variant="secondary">
                <a href={`/assessment-results/${assessment.id}`}>View Results</a>
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCompleteAssessment}
                disabled={completing || answeredCount === 0}
                loading={completing}
              >
                Complete Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {showCompletionModal && completionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[20px] border border-[#e5e5e5] bg-white p-6 shadow-soft fade-in">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f0df] text-[#2d5a1a] shadow-inner">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12.5 11 15l5-6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2c2c2c]">Assessment Complete!</h3>
                <p className="text-sm text-[#6b6b6b]">
                  You answered {completionData.answered} of {completionData.total} sentences.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Progress value={(completionData.answered / completionData.total) * 100} />
              <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner space-y-2">
                <p className="text-sm font-semibold text-[#2c2c2c]">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-[#4a4a4a]">
                  <li>Review your suggestions</li>
                  <li>Choose a sentence to practice</li>
                  <li>Begin your journey</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                disabled={completing}
              >
                Save &amp; Exit
              </Button>
              <Button
                variant="primary"
                loading={completing}
                onClick={() =>
                  router.push(`/assessment-results/${params?.assessmentId}?completed=true`)
                }
              >
                View My Results
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 rounded-[12px] border border-[#c9d8bd] bg-[#e7f0df] px-4 py-3 text-sm text-[#2d5a1a] shadow-soft"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {assessment.previousResponsesBysentenceId?.get(activeTooltipId)?.length ? (
              assessment.previousResponsesBysentenceId?.get(activeTooltipId)?.map((prevResp, idx) => (
                <div key={idx} className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
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
                    <span className="font-medium">Lacuna:</span> {prevResp.assessment.lacuna.nameEn}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs italic">No previous responses found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
