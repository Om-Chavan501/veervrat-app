"use client";

import { useState } from "react";
import { deleteExposureAction } from "@/app/actions/exposure";
import { ExposureForm } from "./exposure-form";
import type { ExposureInstance } from "@/generated/prisma/client";

interface ExposureListProps {
  exposures: ExposureInstance[];
  journeyId: string;
  isOwner: boolean;
  onRefresh?: () => void;
}

export function ExposureList({
  exposures,
  journeyId,
  isOwner,
  onRefresh,
}: ExposureListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exposure?")) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      await deleteExposureAction(id);
      onRefresh?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete exposure";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (exposures.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">No exposures logged yet.</p>
        {isOwner && (
          <p className="mt-2 text-sm text-gray-500">
            Add your first exposure above.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {exposures.map((exposure) => (
          <div
            key={exposure.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            {editingId === exposure.id && isOwner ? (
              <ExposureForm
                journeyId={journeyId}
                exposure={exposure}
                onSuccess={() => {
                  setEditingId(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingId(null)}
                onError={setError}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-900">{exposure.description}</p>
                    {exposure.contextNote && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Context:</span> {exposure.contextNote}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex gap-2 whitespace-nowrap">
                      <button
                        onClick={() => setEditingId(exposure.id)}
                        disabled={deletingId === exposure.id}
                        className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200 disabled:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exposure.id)}
                        disabled={deletingId === exposure.id}
                        className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 disabled:bg-gray-100"
                      >
                        {deletingId === exposure.id ? "..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {exposure.createdAt.toLocaleDateString()} at{" "}
                  {exposure.createdAt.toLocaleTimeString()}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
