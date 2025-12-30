"use client";

import Link from "next/link";
import { useState } from "react";
import { startAssessmentFromShortlistAction } from "@/app/actions/shortlist";
import { Lacuna, LacunaShortlistItem } from "@/generated/prisma";

interface SummaryUIProps {
  sessionId: string;
  items: (LacunaShortlistItem & { lacuna: Lacuna })[];
}

export function SummaryUI({ sessionId, items }: SummaryUIProps) {
  const [selectedLacunaId, setSelectedLacunaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAssessment = async () => {
    if (!selectedLacunaId) return;

    setIsLoading(true);
    try {
      await startAssessmentFromShortlistAction(sessionId, selectedLacunaId);
    } catch (error) {
      console.error("Error starting assessment:", error);
      setIsLoading(false);
    }
  };

  // Group by category
  const lacunaeByCategory = {
    A: items.filter((item) => item.lacuna.category === "A"),
    B: items.filter((item) => item.lacuna.category === "B"),
    C: items.filter((item) => item.lacuna.category === "C"),
  };

  return (
    <>
      {/* Category A */}
      {lacunaeByCategory.A.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Category A</h3>
          <div className="space-y-2">
            {lacunaeByCategory.A.map((item) => (
              <button
                key={item.lacunaId}
                onClick={() => setSelectedLacunaId(item.lacunaId)}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  selectedLacunaId === item.lacunaId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {item.lacuna.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600">{item.lacuna.nameMr}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedLacunaId === item.lacunaId
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedLacunaId === item.lacunaId && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category B */}
      {lacunaeByCategory.B.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Category B</h3>
          <div className="space-y-2">
            {lacunaeByCategory.B.map((item) => (
              <button
                key={item.lacunaId}
                onClick={() => setSelectedLacunaId(item.lacunaId)}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  selectedLacunaId === item.lacunaId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {item.lacuna.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600">{item.lacuna.nameMr}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedLacunaId === item.lacunaId
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedLacunaId === item.lacunaId && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category C */}
      {lacunaeByCategory.C.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Category C</h3>
          <div className="space-y-2">
            {lacunaeByCategory.C.map((item) => (
              <button
                key={item.lacunaId}
                onClick={() => setSelectedLacunaId(item.lacunaId)}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  selectedLacunaId === item.lacunaId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {item.lacuna.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600">{item.lacuna.nameMr}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedLacunaId === item.lacunaId
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedLacunaId === item.lacunaId && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Link
          href={`/lacunae/shortlist/${sessionId}`}
          className="flex-1 px-6 py-3 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium text-center transition"
        >
          ← Back to Selections
        </Link>

        <button
          onClick={handleStartAssessment}
          disabled={!selectedLacunaId || isLoading}
          className="flex-1 px-6 py-3 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {isLoading ? "Starting..." : "Start Assessment →"}
        </button>
      </div>
    </>
  );
}
