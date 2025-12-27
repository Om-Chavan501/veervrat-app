import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { startAssessmentAction } from "@/app/actions/assessment";

export default async function LacunaeSelectionPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get all lacunae
  const lacunae = await prisma.lacuna.findMany({
    include: {
      lacunaSubVirtues: {
        include: {
          subVirtue: true,
        },
        orderBy: { priority: "asc" },
        take: 3, // Show first 3 related subvirtues
      },
    },
  });

  // Get user's active and completed assessments
  const userAssessments = await prisma.lacunaAssessment.findMany({
    where: { userId: session.userId },
    select: { lacunaId: true, status: true },
  });

  const assessmentsByLacuna = new Map(
    userAssessments.map((a) => [a.lacunaId, a.status])
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Select a Lacuna to Assess
      </h2>
      <p className="text-gray-600 mb-8">
        Choose an internal weakness to work on. You can resume an ongoing assessment or start a new one.
      </p>

      <div className="space-y-4">
        {lacunae.map((lacuna) => {
          const status = assessmentsByLacuna.get(lacuna.id);
          const statusLabel = status === "IN_PROGRESS" ? "In Progress" : status === "COMPLETED" ? "Completed" : null;

          return (
            <form
              key={lacuna.id}
              action={async () => {
                "use server";
                await startAssessmentAction(lacuna.id);
              }}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {lacuna.nameEn}
                    {statusLabel && (
                      <span
                        className={`ml-3 text-sm font-medium px-2 py-1 rounded ${
                          status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{lacuna.nameMr}</p>

                  {lacuna.lacunaSubVirtues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Related Virtues to Cultivate
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {lacuna.lacunaSubVirtues.map((lsv) => (
                          <span
                            key={lsv.id}
                            className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {lsv.subVirtue.nameEn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium whitespace-nowrap"
                >
                  {status === "IN_PROGRESS" ? "Resume" : "Start"} Assessment
                </button>
              </div>
            </form>
          );
        })}
      </div>

      {lacunae.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No lacunae available</p>
        </div>
      )}
    </div>
  );
}
