import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createOrLinkJourneyAction } from "@/app/actions/journey";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AssessmentResultsPageProps {
  params: Promise<{ assessmentId: string }>;
}

type Suggestion = {
  id: string;
  sentenceId: string;
  assessmentId: string;
  reason: string;
  sentence: {
    textEn: string;
    textMr: string;
    subVirtue: {
      nameEn: string;
    };
  };
};

export default async function AssessmentResultsPage(props: AssessmentResultsPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await props.params;

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

  if (assessment.userId !== session.userId) {
    redirect("/dashboard");
  }

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
  const unansweredCount =
    assessment.lacuna.lacunaSubVirtues.reduce((sum, lsv) => sum + lsv.subVirtue.sentences.length, 0) -
    answeredCount;

  const topSuggestions = assessment.suggestions.slice(0, 3);
  const remainingSuggestions = assessment.suggestions.slice(3);

  return (
    <div className="space-y-8">
      <Card className="shadow-soft">
        <div className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">Assessment complete</p>
            <h2 className="text-3xl font-bold text-[#2c2c2c]">
              {assessment.lacuna.nameEn}
            </h2>
            <p className="text-sm text-[#6b6b6b]">
              {assessment.completedAt?.toLocaleDateString()}
            </p>
          </div>
          <div className="w-full max-w-md space-y-2 rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#2c2c2c]">Coverage</span>
              <span className="text-[#6b6b6b]">{answeredCount} answered</span>
            </div>
            <Progress value={(answeredCount / totalSentences) * 100} />
            <p className="text-xs text-[#6b6b6b]">
              {unansweredCount} sentence{unansweredCount !== 1 ? "s" : ""} not attempted
            </p>
          </div>
        </div>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Where you feel steady and where practice is needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <SummaryStat label="Always" value={ratingCounts.ALWAYS} tone="success" />
          <SummaryStat label="Often" value={ratingCounts.OFTEN} tone="info" />
          <SummaryStat label="Rarely" value={ratingCounts.RARELY} tone="warning" />
          <SummaryStat label="Never" value={ratingCounts.NEVER} tone="neutral" />
          <SummaryStat label="Not attempted" value={unansweredCount} tone="neutral" />
        </CardContent>
      </Card>

      {assessment.suggestions.length > 0 ? (
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Suggested areas for development</CardTitle>
              <CardDescription>
                Start with the top priorities. You can return to explore the rest.
              </CardDescription>
            </div>
            <Badge tone="info" className="px-2 py-1 text-xs font-bold">
              {assessment.suggestions.length} suggestions
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {topSuggestions.map((suggestion, index) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} index={index} />
              ))}
            </div>

            {remainingSuggestions.length > 0 && (
              <details className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
                <summary className="cursor-pointer text-sm font-semibold text-[#56723f]">
                  View all remaining suggestions ({remainingSuggestions.length})
                </summary>
                <div className="mt-3 space-y-3">
                  {remainingSuggestions.map((suggestion, idx) => (
                    <SuggestionRow
                      key={suggestion.id}
                      suggestion={suggestion}
                      index={idx + topSuggestions.length}
                    />
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200 shadow-soft">
          <CardHeader>
            <CardTitle className="text-green-900">Excellent!</CardTitle>
            <CardDescription className="text-green-800">
              You rated all attempted sentences highly. Continue cultivating these virtues.
              {unansweredCount > 0
                ? ` ${unansweredCount} sentence${unansweredCount !== 1 ? "s" : ""} were not attempted.`
                : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="shadow-soft">
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>All Responses</CardTitle>
            <CardDescription>Your choices across the assessment.</CardDescription>
          </div>
          <Badge tone="neutral" className="px-2 py-1 text-xs font-bold">
            {assessment.responses.length} answered
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.responses.map((response) => (
            <div
              key={response.id}
              className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-[#2c2c2c] font-semibold">
                    {response.sentence.textEn}
                  </p>
                  <p className="text-xs text-[#6b6b6b]">{response.sentence.textMr}</p>
                  <p className="text-xs text-[#6b6b6b]">{response.sentence.subVirtue.nameEn}</p>
                </div>
                <Badge
                  tone={
                    response.rating === "ALWAYS"
                      ? "success"
                      : response.rating === "OFTEN"
                      ? "info"
                      : response.rating === "RARELY"
                      ? "warning"
                      : "neutral"
                  }
                  className="text-xs"
                >
                  {response.rating}
                </Badge>
              </div>
              <div className="mt-3 flex justify-end">
                <form
                  action={async () => {
                    "use server";
                    await createOrLinkJourneyAction(assessment.id, response.sentenceId);
                  }}
                >
                  <Button type="submit" variant="secondary" size="sm">
                    Start Journey
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-[#f7f4ed] text-[#2c2c2c] rounded-[12px] font-semibold border border-[#e5e5e5] hover:border-[#6b8e4e]"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/lacunae"
          className="px-6 py-3 bg-[#6b8e4e] text-white rounded-[12px] font-semibold hover:bg-[#56723f] shadow-soft"
        >
          Start Another Assessment
        </Link>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "info" | "warning" | "neutral";
}) {
  return (
    <div className="rounded-[12px] border border-[#e5e5e5] bg-white/80 px-4 py-3 shadow-inner">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">{label}</p>
      <p className="text-2xl font-bold text-[#2c2c2c]">{value}</p>
      <Badge tone={tone} className="mt-2 text-[11px]">
        {label}
      </Badge>
    </div>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const tone = index === 0 ? "primary" : index === 1 ? "secondary" : "neutral";
  const bg =
    tone === "primary"
      ? "from-[#e7f0df] to-[#f7f4ed]"
      : tone === "secondary"
      ? "from-[#f7ede6] to-[#fff7ed]"
      : "from-white to-[#f7f4ed]";

  return (
    <div className={`rounded-[16px] border border-[#e5e5e5] bg-gradient-to-br ${bg} p-4 shadow-card`}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-9 rounded-full bg-[#2c2c2c] text-white flex items-center justify-center font-bold">
          {index + 1}
        </div>
        <Badge tone="info" className="text-xs">
          {suggestion.sentence.subVirtue.nameEn}
        </Badge>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#2c2c2c]">
        {suggestion.sentence.textEn}
      </p>
      <p className="text-xs text-[#6b6b6b]">{suggestion.sentence.textMr}</p>
      <p className="mt-2 text-xs text-[#6b6b6b] bg-white/70 px-2 py-1 rounded-[10px] inline-block">
        {suggestion.reason}
      </p>
      <form
        action={async () => {
          "use server";
          await createOrLinkJourneyAction(suggestion.assessmentId, suggestion.sentenceId);
        }}
      >
        <Button type="submit" variant="primary" size="sm" className="mt-3 w-full">
          Select &amp; Begin Journey
        </Button>
      </form>
    </div>
  );
}

function SuggestionRow({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-[#e5e5e5] bg-white px-3 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-sm font-semibold text-[#6b6b6b]">{index + 1}.</span>
        <div>
          <p className="text-sm font-semibold text-[#2c2c2c]">
            {suggestion.sentence.textEn}
          </p>
          <p className="text-xs text-[#6b6b6b]">{suggestion.sentence.textMr}</p>
          <p className="text-xs text-[#6b6b6b]">{suggestion.reason}</p>
        </div>
      </div>
      <form
        action={async () => {
          "use server";
          await createOrLinkJourneyAction(suggestion.assessmentId, suggestion.sentenceId);
        }}
      >
        <Button type="submit" variant="secondary" size="sm">
          Start Journey
        </Button>
      </form>
    </div>
  );
}
