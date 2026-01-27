"use client";

import { useState } from "react";
import { addExposureAction, updateExposureAction } from "@/app/actions/exposure";
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          What did you experience?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your exposure experience..."
          required
          disabled={isLoading}
          rows={3}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">Be specific about the situation and what you did.</p>
      </div>

      <div>
        <label
          htmlFor="contextNote"
          className="block text-sm font-medium text-gray-700"
        >
          Context (optional)
        </label>
        <textarea
          id="contextNote"
          value={contextNote}
          onChange={(e) => setContextNote(e.target.value)}
          placeholder="Any additional context or reflections..."
          disabled={isLoading}
          rows={2}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !description}
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Exposure" : "Add Exposure"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 disabled:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>

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
    </form>
  );
}
