import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createOrLinkJourneyAction } from "@/app/actions/journey";

interface AssessmentResultsPageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function AssessmentResultsPage(
  props: AssessmentResultsPageProps
) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await props.params;

  // Get assessment with all related data
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: params.assessmentId },
    include: {
      lacuna: {
        include: {
          lacunaSubVirtues: {
            include: {
              subVirtue: {
                include: {
                  sentences: true,
                },
              },
            },
          },
        },
      },
      responses: {
        include: {
          sentence: {
            include: {
              subVirtue: true,
            },
          },
        },
      },
      suggestions: {
        include: {
          sentence: {
            include: {
              subVirtue: true,
            },
          },
        },
        orderBy: { priorityRank: "asc" },
      },
    },
  });

  if (!assessment) {
    return (
      <div className="text-center text-gray-600">
        <p>Assessment not found</p>
      </div>
    );
  }

  // Verify ownership
  if (assessment.userId !== session.userId) {
    redirect("/dashboard");
  }

  // Count ratings
  const ratingCounts = {
    ALWAYS: 0,
    OFTEN: 0,
    RARELY: 0,
    NEVER: 0,
  };

  assessment.responses.forEach((response) => {
    ratingCounts[response.rating as keyof typeof ratingCounts]++;
  });

  const totalSentences = assessment.suggestions.reduce((sum) => sum + 1, assessment.responses.length);
  const answeredCount = assessment.responses.length;
  const unansweredCount = assessment.lacuna.lacunaSubVirtues.reduce(
    (sum, lsv) => sum + lsv.subVirtue.sentences.length,
    0
  ) - answeredCount;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Assessment Complete: {assessment.lacuna.nameEn}
        </h2>
        <p className="text-gray-600">
          {assessment.completedAt?.toLocaleDateString()}
        </p>
      </div>

      {/* Summary Stats */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {ratingCounts.ALWAYS}
            </div>
            <div className="text-sm text-gray-600">Always</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {ratingCounts.OFTEN}
            </div>
            <div className="text-sm text-gray-600">Often</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {ratingCounts.RARELY}
            </div>
            <div className="text-sm text-gray-600">Rarely</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {ratingCounts.NEVER}
            </div>
            <div className="text-sm text-gray-600">Never</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {unansweredCount}
            </div>
            <div className="text-sm text-gray-600">Not Attempted</div>
          </div>
        </div>
      </section>

      {/* Suggested Sentences with Selection */}
      {assessment.suggestions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Suggested Areas for Development
          </h3>
          <p className="text-gray-600 mb-4">
            Select a sentence to begin your journey of growth. You can work on one at a time or return to this assessment to select others later.
          </p>

          <div className="space-y-4">
            {assessment.suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="bg-blue-50 rounded-lg border border-blue-200 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">
                      {suggestion.sentence.textEn}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.sentence.textMr}
                    </p>
                    <p className="text-xs text-gray-700 bg-white px-2 py-1 rounded inline-block mb-3">
                      <span className="font-medium">
                        {suggestion.sentence.subVirtue.nameEn}
                      </span>
                      {" • "}
                      {suggestion.reason}
                    </p>
                    
                    <form
                      action={async () => {
                        "use server";
                        await createOrLinkJourneyAction(
                          assessment.id,
                          suggestion.sentenceId
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
                      >
                        Select & Begin Journey
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {assessment.suggestions.length === 0 && (
        <section className="bg-green-50 rounded-lg border border-green-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-green-900 mb-2">Excellent!</h3>
          <p className="text-green-800">
            You rated all attempted sentences highly. Continue cultivating these virtues.
          </p>
          {unansweredCount > 0 && (
            <p className="text-sm text-green-700 mt-2">
              💡 {unansweredCount} sentence{unansweredCount !== 1 ? "s" : ""} were not attempted. You can revisit them anytime.
            </p>
          )}
        </section>
      )}

      {/* All Responses */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">All Responses</h3>
        <div className="space-y-3">
          {assessment.responses.map((response) => (
            <div key={response.id} className="border border-gray-200 rounded p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium mb-1">
                    {response.sentence.textEn}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {response.sentence.textMr}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-600">
                      {response.sentence.subVirtue.nameEn}
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        response.rating === "ALWAYS"
                          ? "bg-green-100 text-green-800"
                          : response.rating === "OFTEN"
                          ? "bg-blue-100 text-blue-800"
                          : response.rating === "RARELY"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {response.rating}
                    </span>
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await createOrLinkJourneyAction(
                      assessment.id,
                      response.sentenceId
                    );
                  }}
                  className="flex-shrink-0"
                >
                  <button
                    type="submit"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium whitespace-nowrap"
                  >
                    Start Journey
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/lacunae"
          className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
        >
          Start Another Assessment
        </Link>
      </div>
    </div>
  );
}
