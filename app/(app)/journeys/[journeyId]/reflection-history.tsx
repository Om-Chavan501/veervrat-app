interface DailyReflection {
  id: string;
  date: Date;
  applied: boolean;
  contextNote: string | null;
  insightNote: string | null;
  difficulty: number | null;
}

interface ReflectionHistoryProps {
  reflections: DailyReflection[];
}

export function ReflectionHistory({ reflections }: ReflectionHistoryProps) {
  if (reflections.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p className="text-sm">No reflections yet. Begin your practice today.</p>
      </div>
    );
  }

  // Determine today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {reflections.map((reflection) => {
        const reflectionDate = new Date(reflection.date);
        reflectionDate.setHours(0, 0, 0, 0);

        const isToday = reflectionDate.getTime() === today.getTime();
        const isLocked = reflectionDate < today;

        const displayDate = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(reflection.date);

        return (
          <div
            key={reflection.id}
            className={`rounded-lg border p-4 ${
              isToday
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">{displayDate}</p>
                {isToday && (
                  <p className="text-xs text-blue-700 font-medium">Today</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {reflection.applied && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                    Applied
                  </span>
                )}
                {isLocked && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                    Locked
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {reflection.contextNote && (
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    What Happened
                  </p>
                  <p className="text-sm text-gray-800 bg-white bg-opacity-50 p-2 rounded">
                    {reflection.contextNote}
                  </p>
                </div>
              )}

              {reflection.insightNote && (
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Insight Gained
                  </p>
                  <p className="text-sm text-gray-800 bg-white bg-opacity-50 p-2 rounded">
                    {reflection.insightNote}
                  </p>
                </div>
              )}

              {reflection.difficulty !== null && (
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Difficulty Level
                  </p>
                  <p className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                    {reflection.difficulty} / 10
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
