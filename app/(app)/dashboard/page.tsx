import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get user's active and completed assessments
  const assessments = await prisma.lacunaAssessment.findMany({
    where: { userId: session.userId },
    include: {
      lacuna: true,
    },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  const activeAssessments = assessments.filter((a) => a.status === "IN_PROGRESS");
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>

      {/* Active Assessments */}
      {activeAssessments.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">In Progress</h3>
          <div className="space-y-3">
            {activeAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/assessments/${assessment.id}`}
                className="block bg-yellow-50 rounded-lg border border-yellow-200 p-4 hover:border-yellow-400 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {assessment.lacuna.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Continue assessment
                    </p>
                  </div>
                  <span className="text-sm text-yellow-700 font-medium">
                    Resume →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Completed Assessments */}
      {completedAssessments.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Completed Assessments
          </h3>
          <div className="space-y-3">
            {completedAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/assessment-results/${assessment.id}`}
                className="block bg-green-50 rounded-lg border border-green-200 p-4 hover:border-green-400 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {assessment.lacuna.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {assessment.completedAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-green-700 font-medium">
                    View Results →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Actions */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/lacunae"
            className="block bg-blue-50 rounded-lg border border-blue-200 p-6 hover:border-blue-400 transition"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Start Assessment
            </h4>
            <p className="text-gray-600">
              Select a lacuna and assess yourself
            </p>
          </Link>

          <Link
            href="/ontology"
            className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 transition"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              View Ontology
            </h4>
            <p className="text-gray-600">
              Explore virtues, lacunae, and sentences
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
