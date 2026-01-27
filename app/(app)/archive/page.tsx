import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/time";

export default async function ArchivePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [completedJourneys, completedAssessments] = await Promise.all([
    prisma.sentenceJourney.findMany({
      where: { userId: session.userId, state: "COMPLETED" },
      include: {
        sentence: true,
        reflections: { select: { id: true } },
      },
      orderBy: { inactiveAt: "desc" },
      take: 30,
    }),
    prisma.lacunaAssessment.findMany({
      where: { userId: session.userId, status: "COMPLETED" },
      include: { lacuna: true, suggestions: true },
      orderBy: { completedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-[#2c2c2c]">Archive</h2>
        <p className="text-sm text-[#6b6b6b]">Your completed journeys and assessments.</p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Completed Journeys ({completedJourneys.length})</CardTitle>
          <CardDescription>Journeys you have marked complete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedJourneys.length === 0 ? (
            <EmptyState
              icon={<ArchiveIcon />}
              title="No completed journeys"
              description="Complete an active journey to see it here."
            />
          ) : (
            completedJourneys.map((journey) => (
              <Link
                key={journey.id}
                href={`/journeys/${journey.id}`}
                className="block rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner hover:border-[#6b8e4e]"
              >
                <p className="text-sm font-semibold text-[#2c2c2c]">
                  {journey.sentence.textEn}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {journey.reflections.length} reflections • Completed{" "}
                  {journey.inactiveAt ? formatDistanceToNow(journey.inactiveAt) : "recently"}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Completed Assessments ({completedAssessments.length})</CardTitle>
          <CardDescription>Your finished assessments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedAssessments.length === 0 ? (
            <EmptyState
              icon={<ArchiveIcon />}
              title="No completed assessments"
              description="Finish an assessment to see it here."
            />
          ) : (
            completedAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/assessment-results/${assessment.id}`}
                className="block rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner hover:border-[#6b8e4e]"
              >
                <p className="text-sm font-semibold text-[#2c2c2c]">
                  {assessment.lacuna.nameEn}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  Completed {assessment.completedAt ? formatDistanceToNow(assessment.completedAt) : "recently"} •{" "}
                  {assessment.suggestions.length} suggestions
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <Button asChild variant="ghost">
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 3h10M9 12h6" strokeLinecap="round" />
    </svg>
  );
}
