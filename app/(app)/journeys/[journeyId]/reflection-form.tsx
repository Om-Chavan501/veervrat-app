"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReflectionAction,
  updateReflectionAction,
  deleteReflectionAction,
} from "@/app/actions/reflection";
import { TextAreaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
  const [draftSaved, setDraftSaved] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    applied: existingReflection?.applied ?? false,
    contextNote: existingReflection?.contextNote || "",
    insightNote: existingReflection?.insightNote || "",
    difficulty: existingReflection?.difficulty?.toString() || "",
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem(`reflection-draft-${journeyId}`);
    if (savedDraft && !existingReflection) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
        setDraftSaved("Draft restored");
      } catch {
        // ignore parse errors
      }
    }
  }, [journeyId, existingReflection]);

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

  const handleSaveDraft = () => {
    localStorage.setItem(
      `reflection-draft-${journeyId}`,
      JSON.stringify({
        contextNote: formData.contextNote,
        insightNote: formData.insightNote,
        applied: formData.applied,
        difficulty: formData.difficulty,
      })
    );
    setDraftSaved("Draft saved locally");
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
        <div
          className="rounded-[12px] border border-[#e57373] bg-[#fdecec] px-4 py-3 text-sm text-[#8d2f2f]"
          role="alert"
        >
          {error}
        </div>
      )}

      {draftSaved && (
        <div className="rounded-[12px] border border-[#c9d8bd] bg-[#e7f0df] px-4 py-3 text-sm text-[#2d5a1a]">
          {draftSaved}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner">
        <input
          type="checkbox"
          id="appliedToday"
          checked={formData.applied}
          onChange={(e) =>
            setFormData({ ...formData, applied: e.target.checked })
          }
          disabled={isLoading || isDisabled}
          className="h-5 w-5 rounded border-[#d8d1c6] text-[#6b8e4e] focus:ring-[#6b8e4e]"
        />
        <label
          htmlFor="appliedToday"
          className="text-sm font-semibold text-[#2c2c2c] cursor-pointer"
        >
          I applied this sentence today
        </label>
      </div>

      <TextAreaField
        id="contextNote"
        label="What happened? (Context)"
        hint="Describe the situation and what you did."
        value={formData.contextNote}
        onChange={(e) =>
          setFormData({ ...formData, contextNote: e.target.value })
        }
        placeholder="Describe the situation or moment where you worked with this sentence today..."
        rows={4}
        disabled={isLoading || isDisabled}
        error={error?.toLowerCase().includes("context") ? error : undefined}
      />

      <TextAreaField
        id="insightNote"
        label="What insight did you gain?"
        hint="What did you notice about yourself, the sentence, or the practice?"
        value={formData.insightNote}
        onChange={(e) =>
          setFormData({ ...formData, insightNote: e.target.value })
        }
        placeholder="What did you learn about yourself, the sentence, or the work today?"
        rows={4}
        disabled={isLoading || isDisabled}
        error={error?.toLowerCase().includes("insight") ? error : undefined}
      />

      <div className="space-y-2 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#2c2c2c]">
            What difficulty did you face? (Optional)
          </label>
          <span className="text-xs text-[#6b6b6b]">
            {formData.difficulty ? `${formData.difficulty}/10` : "—"}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={formData.difficulty || "5"}
          onChange={(e) =>
            setFormData({ ...formData, difficulty: e.target.value })
          }
          disabled={isLoading || isDisabled}
          className="w-full accent-[#6b8e4e]"
        />
        <p className="text-xs text-[#6b6b6b]">
          Slide to rate the effort needed today.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="subtle"
          onClick={handleSaveDraft}
          disabled={isLoading || isDisabled}
        >
          Save Draft
        </Button>

        {existingReflection && isEditing && (
          <Button
            type="button"
            variant="ghost"
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
          >
            Cancel
          </Button>
        )}

        {existingReflection && isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || isDisabled}
          loading={isLoading}
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
        </Button>
      </div>

      {existingReflection && !isEditing && (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            Edit today&apos;s reflection
          </Button>
        </div>
      )}
    </form>
  );
}
