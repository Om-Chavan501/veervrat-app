"use client";

import { useState, useCallback } from "react";
import { getExposuresAction } from "@/app/actions/exposure";
import { ExposureList } from "./exposure-list";
import type { ExposureInstance } from "@/generated/prisma/client";

interface ExposuresSectionProps {
  initialExposures: ExposureInstance[];
  journeyId: string;
  isOwner: boolean;
}

export function ExposuresSection({
  initialExposures,
  journeyId,
  isOwner,
}: ExposuresSectionProps) {
  const [exposures, setExposures] = useState(initialExposures);

  const handleRefresh = useCallback(async () => {
    try {
      const updated = await getExposuresAction(journeyId);
      setExposures(updated);
    } catch (error) {
      console.error("Failed to refresh exposures:", error);
    }
  }, [journeyId]);

  return (
    <ExposureList
      exposures={exposures}
      journeyId={journeyId}
      isOwner={isOwner}
      onRefresh={handleRefresh}
    />
  );
}
