"use client";

import { useState } from "react";
import { detachVratmiraAction } from "@/app/actions/vratmitra";
import type { JourneyVratmitra, User } from "@/generated/prisma/client";

interface VratmitraStatusDisplayProps {
  vratmitra: (JourneyVratmitra & { user: User }) | null;
  journeyId: string;
  isJourneyOwner: boolean;
  onDetach?: () => void;
  onError?: (error: string) => void;
}

export function VratmitraStatusDisplay({
  vratmitra,
  journeyId,
  isJourneyOwner,
  onDetach,
  onError,
}: VratmitraStatusDisplayProps) {
  const [isDetaching, setIsDetaching] = useState(false);

  const handleDetach = async () => {
    if (!window.confirm("Are you sure you want to detach the Vratmitra?")) {
      return;
    }

    setIsDetaching(true);
    try {
      await detachVratmiraAction(journeyId);
      onDetach?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to detach Vratmitra";
      onError?.(errorMessage);
    } finally {
      setIsDetaching(false);
    }
  };

  if (!vratmitra) {
    return null;
  }

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Active Vratmitra</p>
          <p className="text-lg font-semibold text-blue-900">{vratmitra.user.name}</p>
          {vratmitra.user.email && (
            <p className="text-sm text-gray-600">{vratmitra.user.email}</p>
          )}
        </div>
        {isJourneyOwner && (
          <button
            onClick={handleDetach}
            disabled={isDetaching}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
          >
            {isDetaching ? "Detaching..." : "Detach"}
          </button>
        )}
      </div>
    </div>
  );
}
