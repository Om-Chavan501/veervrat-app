"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReflectionAction,
  updateReflectionAction,
  deleteReflectionAction,
} from "@/app/actions/reflection";

interface ReflectionFormProps {
  journeyId: string;
  existingReflection?: {
    id: string;
    applied: boolean;
    contextNote: string | null;
    insightNote: string | null;
    difficulty: number | null;
  };
  journeyState: "ACTIVE" | "INACTIVE" | "COMPLETED";
}

export function ReflectionForm({
  journeyId,
  existingReflection,
  journeyState,
}: ReflectionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    applied: existingReflection?.applied ?? false,
    contextNote: existingReflection?.contextNote || "",
    insightNote: existingReflection?.insightNote || "",
    difficulty: existingReflection?.difficulty?.toString() || "",
  });

  const isDisabled = journeyState !== "ACTIVE";
  const isEditable = !!existingReflection && !isDisabled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.contextNote.trim()) {
      setError("Please describe what happened and the context");
      return;
    }

    if (!formData.insightNote.trim()) {
      setError("Please share the insight you gained");
      return;
    }

    setIsLoading(true);

    try {
      if (existingReflection) {
        await updateReflectionAction(existingReflection.id, formData);
        setIsEditing(false);
      } else {
        await createReflectionAction(journeyId, formData);
        setFormData({
          applied: false,
          contextNote: "",
          insightNote: "",
          difficulty: "",
        });
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to save reflection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save reflection"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReflection) return;
    if (!confirm("Delete today's reflection?")) return;

    setIsLoading(true);

    try {
      await deleteReflectionAction(existingReflection.id);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete reflection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete reflection"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If journey is not active and no reflection exists
  if (isDisabled && !existingReflection) {
    return null;
  }

  // If journey is not active and reflection exists but not editing
  if (isDisabled && !isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600 italic">
          This journey is not active, so you cannot log new reflections.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      {/* Applied Today Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="appliedToday"
          checked={formData.applied}
          onChange={(e) =>
            setFormData({ ...formData, applied: e.target.checked })
          }
          disabled={isLoading || isDisabled}
          className="w-5 h-5"
        />
        <label
          htmlFor="appliedToday"
          className="text-base font-medium text-gray-900 cursor-pointer"
        >
          I applied this sentence today
        </label>
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          What happened? (Context)
        </label>
        <textarea
          value={formData.contextNote}
          onChange={(e) =>
            setFormData({ ...formData, contextNote: e.target.value })
          }
          placeholder="Describe the situation or moment where you worked with this sentence today..."
          rows={3}
          disabled={isLoading || isDisabled}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Insight Gained */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          What insight did you gain?
        </label>
        <textarea
          value={formData.insightNote}
          onChange={(e) =>
            setFormData({ ...formData, insightNote: e.target.value })
          }
          placeholder="What did you learn about yourself, the sentence, or the work today?"
          rows={3}
          disabled={isLoading || isDisabled}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Difficulty Faced (Optional) */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          What difficulty did you face? (Optional, 1-10 scale)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.difficulty}
          onChange={(e) =>
            setFormData({ ...formData, difficulty: e.target.value })
          }
          placeholder="Rate difficulty from 1 (easy) to 10 (very hard)"
          disabled={isLoading || isDisabled}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {existingReflection && isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setError(null);
              setFormData({
                applied: existingReflection.applied,
                contextNote: existingReflection.contextNote || "",
                insightNote: existingReflection.insightNote || "",
                difficulty: existingReflection.difficulty?.toString() || "",
              });
            }}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        {existingReflection && isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-6 py-3 border border-red-300 text-red-700 rounded font-medium hover:bg-red-50 transition disabled:opacity-50"
          >
            Delete
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading || isDisabled}
          className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading
            ? existingReflection
              ? "Updating..."
              : "Saving..."
            : existingReflection && isEditing
            ? "Update Reflection"
            : existingReflection
            ? "Edit"
            : "Save Reflection"}
        </button>
      </div>

      {/* Edit Button for Existing */}
      {existingReflection && !isEditing && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit today's reflection
          </button>
        </div>
      )}
    </form>
  );
}
