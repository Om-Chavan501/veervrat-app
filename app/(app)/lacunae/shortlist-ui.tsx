"use client";

import { useState, useMemo } from "react";
import { LacunaCategory } from "@/generated/prisma/enums";
import { Lacuna, LacunaShortlistItem } from "@/generated/prisma";
import {
  addToShortlistAction,
  removeFromShortlistAction,
} from "@/app/actions/shortlist";

interface ShortlistUIProps {
  sessionId: string;
  allLacunae: (Lacuna & { isSelected: boolean })[];
  initialShortlist: (LacunaShortlistItem & { lacuna: Lacuna })[];
}

const CATEGORIES = [
  { key: "A" as LacunaCategory, label: "Category A" },
  { key: "B" as LacunaCategory, label: "Category B" },
  { key: "C" as LacunaCategory, label: "Category C" },
];

export function ShortlistUI({
  sessionId,
  allLacunae,
  initialShortlist,
}: ShortlistUIProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedLacunae, setSelectedLacunae] = useState<Set<string>>(
    new Set(initialShortlist.map((item) => item.lacunaId))
  );
  const [isLoading, setIsLoading] = useState(false);

  const lacunaeByCategory = useMemo(() => {
    return {
      A: allLacunae.filter((l) => l.category === "A"),
      B: allLacunae.filter((l) => l.category === "B"),
      C: allLacunae.filter((l) => l.category === "C"),
    };
  }, [allLacunae]);

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const currentLacunae = lacunaeByCategory[currentCategory.key];
  const selectedCount = useMemo(() => {
    const countByCategory = { A: 0, B: 0, C: 0 };
    selectedLacunae.forEach((lacunaId) => {
      const lacuna = allLacunae.find((l) => l.id === lacunaId);
      if (lacuna) {
        countByCategory[lacuna.category as LacunaCategory]++;
      }
    });
    return countByCategory;
  }, [selectedLacunae, allLacunae]);

  const handleToggleLacuna = async (lacunaId: string) => {
    setIsLoading(true);
    try {
      if (selectedLacunae.has(lacunaId)) {
        await removeFromShortlistAction(sessionId, lacunaId);
        const newSelected = new Set(selectedLacunae);
        newSelected.delete(lacunaId);
        setSelectedLacunae(newSelected);
      } else {
        await addToShortlistAction(sessionId, lacunaId);
        const newSelected = new Set(selectedLacunae);
        newSelected.add(lacunaId);
        setSelectedLacunae(newSelected);
      }
    } catch (error) {
      console.error("Error toggling lacuna:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCategoryIndex < CATEGORIES.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const hasAtLeastOneSelected =
    Object.values(selectedCount).reduce((a, b) => a + b, 0) > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Progress</h3>
          <p className="text-sm text-gray-600">
            {Object.values(selectedCount).reduce((a, b) => a + b, 0)} selected
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <div
              key={cat.key}
              className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                currentCategoryIndex === idx
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
              onClick={() => setCurrentCategoryIndex(idx)}
            >
              <p className="font-semibold text-gray-900">{cat.label}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {selectedCount[cat.key]}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {lacunaeByCategory[cat.key].length} available
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Category Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {currentCategory.label}
        </h3>
        <p className="text-gray-600 mb-4">
          Select lacunae to work on. We suggest 1-3 per category.
        </p>

        <div className="space-y-3">
          {currentLacunae.length > 0 ? (
            currentLacunae.map((lacuna) => (
              <button
                key={lacuna.id}
                onClick={() => handleToggleLacuna(lacuna.id)}
                disabled={isLoading}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  selectedLacunae.has(lacuna.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{lacuna.nameEn}</h4>
                    <p className="text-sm text-gray-600">{lacuna.nameMr}</p>
                  </div>
                  <div
                    className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedLacunae.has(lacuna.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedLacunae.has(lacuna.id) && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No lacunae in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0 || isLoading}
          className="px-6 py-2 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          ← Previous
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {currentCategoryIndex + 1} of {CATEGORIES.length}
          </p>
        </div>

        {currentCategoryIndex < CATEGORIES.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Next →
          </button>
        ) : (
          <a
            href={`/lacunae/shortlist/${sessionId}/summary`}
            className={`px-6 py-2 rounded font-medium transition ${
              hasAtLeastOneSelected
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-50"
            }`}
            onClick={(e) => {
              if (!hasAtLeastOneSelected) {
                e.preventDefault();
              }
            }}
          >
            Review Selections →
          </a>
        )}
      </div>

      {currentCategoryIndex === CATEGORIES.length - 1 && !hasAtLeastOneSelected && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <p>
            <strong>Suggestion:</strong> Please select at least one lacuna to
            proceed.
          </p>
        </div>
      )}
    </div>
  );
}
