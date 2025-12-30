import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startShortlistSessionAction } from "@/app/actions/shortlist";

export default async function LacunaeSelectionPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get user's shortlist sessions
  const shortlistSessions = await prisma.lacunaShortlistSession.findMany({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          lacuna: true,
        },
      },
      lacunaAssessments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Separate in-progress and previous sessions
  const inProgressSessions = shortlistSessions.filter(
    (s) => s.lacunaAssessments.length === 0 && s.items.length > 0
  );
  const previousSessions = shortlistSessions.filter(
    (s) => s.lacunaAssessments.length > 0
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Start a New Assessment
      </h2>
      <p className="text-gray-600 mb-8">
        Begin by selecting which internal weaknesses you want to work on. You can choose from our lacunae across three categories.
      </p>

      {/* In Progress Sessions */}
      {inProgressSessions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            In Progress Shortlists
          </h3>
          <div className="space-y-3 mb-8">
            {inProgressSessions.map((session) => (
              <Link
                key={session.id}
                href={`/lacunae/shortlist/${session.id}`}
                className="block bg-yellow-50 rounded-lg border border-yellow-200 p-4 hover:border-yellow-400 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {session.items.length} lacunae selected
                    </h4>
                    <p className="text-sm text-gray-600">
                      Started {session.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-yellow-700 font-medium">
                    Continue →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Previous Sessions */}
      {previousSessions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Previous Shortlists
          </h3>
          <div className="space-y-3 mb-8">
            {previousSessions.map((session) => (
              <Link
                key={session.id}
                href={`/lacunae/shortlist/${session.id}/summary`}
                className="block bg-blue-50 rounded-lg border border-blue-200 p-4 hover:border-blue-400 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {session.items.length} lacunae in this selection
                    </h4>
                    <p className="text-sm text-gray-600">
                      Created {session.createdAt.toLocaleDateString()} •{" "}
                      {session.lacunaAssessments.length} assessment
                      {session.lacunaAssessments.length !== 1 ? "s" : ""} started
                    </p>
                  </div>
                  <span className="text-sm text-blue-700 font-medium">
                    Reuse →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Assessment CTA */}
      <form action={startShortlistSessionAction} className="max-w-md">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Begin New Assessment Journey
          </h3>
          <p className="text-gray-700 mb-6">
            Start fresh by selecting new lacunae from our three categories to work on.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">A</span>
              <div>
                <p className="font-semibold text-gray-900">Category A</p>
                <p className="text-sm text-gray-600">First set of lacunae</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">B</span>
              <div>
                <p className="font-semibold text-gray-900">Category B</p>
                <p className="text-sm text-gray-600">Second set of lacunae</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">C</span>
              <div>
                <p className="font-semibold text-gray-900">Category C</p>
                <p className="text-sm text-gray-600">Third set of lacunae</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start New Shortlisting →
          </button>
        </div>
      </form>
    </div>
  );
}
