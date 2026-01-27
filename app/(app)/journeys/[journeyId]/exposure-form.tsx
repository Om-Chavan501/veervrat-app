"use client";

import { useState } from "react";
import { addExposureAction, updateExposureAction } from "@/app/actions/exposure";
import { TextAreaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { ExposureInstance } from "@/generated/prisma/client";

interface ExposureFormProps {
  journeyId: string;
  exposure?: ExposureInstance;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export function ExposureForm({
  journeyId,
  exposure,
  onSuccess,
  onCancel,
  onError,
}: ExposureFormProps) {
  const [description, setDescription] = useState(exposure?.description || "");
  const [contextNote, setContextNote] = useState(exposure?.contextNote || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isEditing = !!exposure;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isEditing) {
        await updateExposureAction(exposure!.id, {
          description,
          contextNote: contextNote || undefined,
        });
      } else {
        await addExposureAction(journeyId, {
          description,
          contextNote: contextNote || undefined,
        });
      }

      setMessage({
        type: "success",
        text: isEditing ? "Exposure updated" : "Exposure added",
      });
      
      setDescription("");
      setContextNote("");
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save exposure";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-4 shadow-inner">
      {message && (
        <div
          className={`rounded-[12px] border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-[#c9d8bd] bg-[#e7f0df] text-[#2d5a1a]"
              : "border-[#e57373] bg-[#fdecec] text-[#8d2f2f]"
          }`}
        >
          {message.text}
        </div>
      )}

      <TextAreaField
        id="description"
        label="What did you experience?"
        hint="Be specific about the situation and what you did."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your exposure experience..."
        required
        disabled={isLoading}
        rows={3}
      />

      <TextAreaField
        id="contextNote"
        label="Context (optional)"
        hint="Any additional context or reflections."
        value={contextNote}
        onChange={(e) => setContextNote(e.target.value)}
        placeholder="Optional details or feelings."
        disabled={isLoading}
        rows={2}
        optional
      />

      <div className="flex gap-2">
        <Button type="submit" variant="secondary" className="flex-1" disabled={isLoading || !description} loading={isLoading}>
          {isEditing ? "Update Exposure" : "Add Exposure"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
