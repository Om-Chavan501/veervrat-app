"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveClarificationAction } from "@/app/actions/journey";
import { IrrationalBelief } from "@/generated/prisma/enums";

interface ClarificationFormProps {
  journeyId: string;
  assessmentId: string;
  sentenceName: string;
  lacunaName: string;
  subVirtueName: string;
  existingClarification?: {
    virtueRelationNote: string | null;
    lacunaReductionNote: string;
    unifiedInsightNote: string;
    personalContextNote: string;
    irrationalBelief: IrrationalBelief | null;
  };
}

const IRRATIONAL_BELIEFS = [
  IrrationalBelief.MUST_BE_LOVED,
  IrrationalBelief.MUST_BE_COMPETENT,
  IrrationalBelief.MUST_HAVE_COMFORT,
];

const IRRATIONAL_BELIEF_LABELS: Record<IrrationalBelief, string> = {
  [IrrationalBelief.MUST_BE_LOVED]: "I must be loved and accepted by others",
  [IrrationalBelief.MUST_BE_COMPETENT]: "I must be competent and successful in all I do",
  [IrrationalBelief.MUST_HAVE_COMFORT]: "I must have comfort and avoid pain",
};

export function ClarificationForm({
  journeyId,
  assessmentId,
  sentenceName,
  lacunaName,
  subVirtueName,
  existingClarification,
}: ClarificationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    virtueRelationNote: existingClarification?.virtueRelationNote || "",
    lacunaReductionNote: existingClarification?.lacunaReductionNote || "",
    unifiedInsightNote: existingClarification?.unifiedInsightNote || "",
    personalContextNote: existingClarification?.personalContextNote || "",
    irrationalBelief: existingClarification?.irrationalBelief || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.irrationalBelief) {
      setError("Please select your core irrational belief");
      return;
    }

    if (!formData.virtueRelationNote) {
      setError("Please answer how this sentence relates to your inner work");
      return;
    }

    if (!formData.lacunaReductionNote) {
      setError("Please explain how developing this virtue reduces the lacuna");
      return;
    }

    if (!formData.unifiedInsightNote) {
      setError("Please write your unified insight");
      return;
    }

    if (!formData.personalContextNote) {
      setError("Please share your personal context");
      return;
    }

    setIsLoading(true);

    try {
      await saveClarificationAction(journeyId, assessmentId, {
        virtueRelationNote: formData.virtueRelationNote,
        lacunaReductionNote: formData.lacunaReductionNote,
        unifiedInsightNote: formData.unifiedInsightNote,
        personalContextNote: formData.personalContextNote,
        irrationalBelief: formData.irrationalBelief as IrrationalBelief,
      });
      router.push(`/journeys/${journeyId}`);
    } catch (err) {
      console.error("Failed to save clarification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save clarification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      {/* Question 1: Virtue Relation */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-base font-bold text-gray-900 mb-2">
          How does "{sentenceName}" relate to developing your{" "}
          <span className="text-blue-600">{subVirtueName}</span>?
        </legend>
        <p className="text-sm text-gray-600 mb-4">
          Explain the connection between practicing this sentence and building the
          virtue that opposes your {lacunaName}.
        </p>
        <textarea
          value={formData.virtueRelationNote}
          onChange={(e) =>
            setFormData({ ...formData, virtueRelationNote: e.target.value })
          }
          placeholder="e.g., 'This sentence helps me practice gratitude, which counters my tendency to focus on what I lack...'"
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </fieldset>

      {/* Question 2: Lacuna Reduction */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-base font-bold text-gray-900 mb-2">
          How does strengthening your{" "}
          <span className="text-blue-600">{subVirtueName}</span> reduce your{" "}
          <span className="text-red-600">{lacunaName}</span>?
        </legend>
        <p className="text-sm text-gray-600 mb-4">
          Show the causal link: by consistently practicing this virtue, how does your
          gap get smaller?
        </p>
        <textarea
          value={formData.lacunaReductionNote}
          onChange={(e) =>
            setFormData({ ...formData, lacunaReductionNote: e.target.value })
          }
          placeholder="e.g., 'Each time I practice gratitude, I train my mind to notice good things. Over time, my baseline anxiety about scarcity decreases...'"
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </fieldset>

      {/* Question 3: Unified Insight */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-base font-bold text-gray-900 mb-2">
          Your Unified Insight
        </legend>
        <p className="text-sm text-gray-600 mb-4">
          Synthesize your two answers above into one clear insight about your
          transformation.
        </p>
        <textarea
          value={formData.unifiedInsightNote}
          onChange={(e) =>
            setFormData({ ...formData, unifiedInsightNote: e.target.value })
          }
          placeholder="e.g., 'By training myself to notice and appreciate good things (sentence) and building my gratitude muscle ({subVirtueName}), I systematically heal my core wound of scarcity and unworthiness ({lacunaName})...'"
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </fieldset>

      {/* Question 4: Personal Context */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-base font-bold text-gray-900 mb-2">
          Your Personal Context
        </legend>
        <p className="text-sm text-gray-600 mb-4">
          Share a specific personal incident related to your {lacunaName}. Where
          does this sentence apply?
        </p>
        <textarea
          value={formData.personalContextNote}
          onChange={(e) =>
            setFormData({ ...formData, personalContextNote: e.target.value })
          }
          placeholder="e.g., 'Yesterday, my colleague didn't respond to my email and I spiraled into panic that I wasn't good enough. This is my core pattern. If I had practiced this sentence then, I would have...'"
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </fieldset>

      {/* Core Irrational Belief Selection */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-base font-bold text-gray-900 mb-4">
          Your Core Irrational Belief
        </legend>
        <p className="text-sm text-gray-600 mb-4">
          Which underlying irrational belief is most active in your {lacunaName}?
        </p>
        <div className="space-y-3">
          {IRRATIONAL_BELIEFS.map((belief) => (
            <label key={belief} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="irrationalBelief"
                value={belief}
                checked={formData.irrationalBelief === belief}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    irrationalBelief: e.target.value,
                  })
                }
                className="mt-1"
              />
              <span className="text-gray-900">
                {IRRATIONAL_BELIEF_LABELS[belief]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Clarification & Continue"}
        </button>
      </div>
    </form>
  );
}
