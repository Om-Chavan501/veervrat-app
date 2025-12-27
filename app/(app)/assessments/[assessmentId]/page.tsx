"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssessmentDetailsAction, saveResponseAction, completeAssessmentAction } from "@/app/actions/assessment";
import type { Rating } from "@/generated/prisma/enums";

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
        setError(err instanceof Error ? err.message : "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [params]);

  const handleRating = async (sentenceId: string, rating: Rating) => {
    try {
      setSaving(true);
      await saveResponseAction(params!.assessmentId, sentenceId, rating);
      setCurrentRatings((prev) => new Map(prev).set(sentenceId, rating));
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
      // Redirect to results page
      router.push(`/assessment-results/${params!.assessmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete assessment");
      setCompleting(false);
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
            <span className="font-bold">{totalSentences}</span> sentences answered
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

                return (
                  <div
                    key={sentence.id}
                    className="border border-gray-200 rounded p-4"
                  >
                    <p className="text-sm text-gray-800 mb-3 font-medium">
                      {sentence.textEn}
                    </p>
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
                            } ${isCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
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
            disabled={completing || answeredCount < totalSentences}
            className={`px-6 py-3 rounded font-medium transition ${
              answeredCount < totalSentences
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
    </div>
  );
}
