"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addResolutionAction,
  updateResolutionAction,
  deleteResolutionAction,
} from "@/app/actions/journey";
import Link from "next/link";

interface Journey {
  id: string;
  sentence: {
    textEn: string;
    textMr: string;
    subVirtue: {
      nameEn: string;
    };
  };
  resolutions: Array<{
    id: string;
    text: string;
    frequency: string;
    createdAt: Date;
  }>;
}

const FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "WHENEVER_TRIGGERED", label: "Whenever Triggered" },
  { value: "SPECIFIC_TIMES", label: "Specific Times" },
];

export function ResolutionsContent({
  journey,
  userId,
}: {
  journey: Journey;
  userId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    text: "",
    frequency: "DAILY",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.text.trim()) {
      setError("Please enter a resolution");
      return;
    }

    setIsLoading(true);

    try {
      await addResolutionAction(journey.id, formData.text, formData.frequency);
      setFormData({ text: "", frequency: "DAILY" });
      router.refresh();
    } catch (err) {
      console.error("Failed to add resolution:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add resolution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (resolutionId: string) => {
    setError(null);

    if (!formData.text.trim()) {
      setError("Please enter a resolution");
      return;
    }

    setIsLoading(true);

    try {
      await updateResolutionAction(
        resolutionId,
        formData.text,
        formData.frequency
      );
      setFormData({ text: "", frequency: "DAILY" });
      setEditingId(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to update resolution:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update resolution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (resolutionId: string) => {
    if (!confirm("Delete this resolution?")) {
      return;
    }

    setIsLoading(true);

    try {
      await deleteResolutionAction(resolutionId);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete resolution:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete resolution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (resolution: (typeof journey.resolutions)[0]) => {
    setFormData({
      text: resolution.text,
      frequency: resolution.frequency,
    });
    setEditingId(resolution.id);
  };

  const cancelEdit = () => {
    setFormData({ text: "", frequency: "DAILY" });
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Current Resolutions */}
      {journey.resolutions.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Your Current Resolutions
          </h3>
          <div className="space-y-3">
            {journey.resolutions.map((resolution) => (
              <div
                key={resolution.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      {resolution.text}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{resolution.frequency}</span>
                      {" • "}
                      Added{" "}
                      {new Date(resolution.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(resolution)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resolution.id)}
                      disabled={isLoading}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add/Edit Form */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editingId ? "Edit Resolution" : "Add a New Resolution"}
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              handleEdit(editingId);
            } else {
              handleAdd(e);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Your Resolution
            </label>
            <textarea
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              placeholder="e.g., 'Each morning, I will write three things I'm grateful for before checking my phone'"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-2">
              Be specific and actionable. Include where, when, and how you'll do
              it.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 justify-center">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Resolution"
                : "Add Resolution"}
            </button>
          </div>
        </form>
      </section>

      {/* Back Link */}
      <div>
        <Link
          href={`/journeys/${journey.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Journey
        </Link>
      </div>
    </div>
  );
}
