import Link from "next/link";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PendingVratmitraInvitations } from "./pending-vratmitra-invitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const assessments = await prisma.lacunaAssessment.findMany({
    where: { userId: session.userId },
    include: {
      lacuna: true,
    },
    orderBy: { startedAt: "desc" },
    take: 6,
  });

  const activeAssessments = assessments.filter((a) => a.status === "IN_PROGRESS");
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");

  const journeys = await prisma.sentenceJourney.findMany({
    where: { userId: session.userId },
    include: {
      sentence: {
        include: {
          subVirtue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const journeyIds = journeys.map((j) => j.id);
  const reflectionMeta =
    journeyIds.length > 0
      ? await prisma.dailyReflection.groupBy({
          by: ["journeyId"],
          where: { journeyId: { in: journeyIds } },
          _count: { _all: true },
          _max: { date: true },
        })
      : [];

  const reflectionCountByJourney = new Map<string, number>();
  const lastReflectionByJourney = new Map<string, Date | null>();

  reflectionMeta.forEach((meta) => {
    reflectionCountByJourney.set(meta.journeyId, meta._count._all);
    lastReflectionByJourney.set(meta.journeyId, meta._max.date);
  });

  const activeJourneys = journeys.filter((j) => j.state === "ACTIVE");
  const inactiveJourneys = journeys.filter((j) => j.state === "INACTIVE");
  const completedJourneys = journeys.filter((j) => j.state === "COMPLETED");

  return (
    <div className="space-y-10">
      <section className="card shadow-soft">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
              Welcome back
            </p>
            <h2 className="text-3xl font-bold text-[#2c2c2c]">
              {session.name}, keep moving with intention
            </h2>
            <p className="text-base text-[#6b6b6b] max-w-2xl">
              Your journeys, assessments, and reflections are all in one place. Stay steady, one practice at a time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatPill
              label="Active journeys"
              value={activeJourneys.length}
              tone="active"
              helper={`${completedJourneys.length} completed`}
            />
            <StatPill
              label="Assessments in progress"
              value={activeAssessments.length}
              tone="info"
              helper={`${completedAssessments.length} done`}
            />
            <StatPill
              label="Invitations"
              value={<PendingInviteCount userId={session.userId} />}
              tone="neutral"
              helper="Review companions"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" id="journeys">
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Active Journeys</CardTitle>
              <CardDescription>Recent practice threads you&apos;re nurturing.</CardDescription>
            </div>
            <Badge tone="active" className="px-2 py-1 text-xs font-bold">
              {activeJourneys.length} active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJourneys.length === 0 ? (
              <EmptyState
                title="No active journeys"
                description="Select a suggested sentence from your assessments to begin."
                action={
                  <Link
                    href="/assessment-results"
                    className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
                  >
                    View assessments
                  </Link>
                }
              />
            ) : (
              activeJourneys.slice(0, 3).map((journey) => {
                const reflectionCount = reflectionCountByJourney.get(journey.id) ?? 0;
                const lastReflection = lastReflectionByJourney.get(journey.id);

                return (
                  <Link
                    key={journey.id}
                    href={`/journeys/${journey.id}`}
                    className="group block rounded-[16px] border border-[#e5e5e5] bg-gradient-to-br from-white to-[#f8f5ee] px-5 py-4 shadow-card transition hover:-translate-y-0.5 hover:border-[#6b8e4e] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b8e4e]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge tone="neutral" className="px-2 py-1 text-xs font-semibold">
                          {journey.sentence.subVirtue.nameEn}
                        </Badge>
                        <p className="text-base font-semibold text-[#2c2c2c]">
                          {journey.sentence.textEn.slice(0, 80)}
                          {journey.sentence.textEn.length > 80 ? "…" : ""}
                        </p>
                        <p className="text-sm text-[#6b6b6b]">
                          {journey.sentence.textMr}
                        </p>
                        <div className="flex items-center gap-3">
                          <Progress value={Math.min(reflectionCount, 15)} max={15} />
                          <span className="text-xs text-[#6b6b6b]">
                            {reflectionCount} reflections
                          </span>
                        </div>
                        <p className="text-xs text-[#6b6b6b]">
                          Last reflection:{" "}
                          {lastReflection
                            ? new Date(lastReflection).toLocaleDateString()
                            : "Not yet logged"}
                        </p>
                      </div>
                      <Badge tone="active" pulseOnHover>
                        Continue
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}

            {activeJourneys.length > 3 && (
              <div className="flex justify-end">
                <Link
                  href="/dashboard#journeys"
                  className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
                >
                  View all journeys →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Companion Invitations</CardTitle>
              <CardDescription>Review requests to be a Vratmitra.</CardDescription>
            </div>
            <Badge tone="info" className="px-2 py-1 text-xs font-bold">
              Mindful support
            </Badge>
          </CardHeader>
          <CardContent>
            <PendingVratmitraInvitations />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>Your recent explorations and results.</CardDescription>
            </div>
            <Badge tone="info" className="px-2 py-1 text-xs font-bold">
              {assessments.length} recent
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessments.length === 0 ? (
              <EmptyState
                title="No assessments yet"
                description="Start with a lacuna shortlist to receive tailored practice sentences."
                action={
                  <Link
                    href="/lacunae"
                    className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
                  >
                    Start an assessment
                  </Link>
                }
              />
            ) : (
              assessments.slice(0, 5).map((assessment) => (
                <div
                  key={assessment.id}
                  className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#2c2c2c]">
                        {assessment.lacuna.nameEn}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{assessment.lacuna.nameMr}</p>
                      <p className="text-xs text-[#6b6b6b]">
                        Started {assessment.startedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      tone={
                        assessment.status === "COMPLETED"
                          ? "completed"
                          : assessment.status === "IN_PROGRESS"
                          ? "active"
                          : "neutral"
                      }
                    >
                      {assessment.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link
                      href={
                        assessment.status === "COMPLETED"
                          ? `/assessment-results/${assessment.id}`
                          : `/assessments/${assessment.id}`
                      }
                      className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
                    >
                      {assessment.status === "COMPLETED" ? "View results" : "Continue"}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Step back in whenever you are ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="primary" className="w-full">
              <Link href="/lacunae">Start Assessment</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/ontology">Open Ontology</Link>
            </Button>
            <Button asChild variant="subtle" className="w-full">
              <Link href="/dashboard#journeys">Review Journeys</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="profile">
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Profile &amp; Settings</CardTitle>
              <CardDescription>Keep your companion details up to date.</CardDescription>
            </div>
            <Badge tone="neutral">Slow mode</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">Name</p>
              <p className="text-sm font-semibold text-[#2c2c2c]">{session.name}</p>
            </div>
            <div className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">Email</p>
              <p className="text-sm font-semibold text-[#2c2c2c]">{session.email}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-[#d8d1c6] bg-[#faf6ef] px-4 py-5">
      <p className="text-base font-semibold text-[#2c2c2c]">{title}</p>
      <p className="text-sm text-[#6b6b6b]">{description}</p>
      {action}
    </div>
  );
}

function StatPill({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number | ReactNode;
  helper?: string;
  tone?: "active" | "info" | "neutral";
}) {
  const toneClasses =
    tone === "active"
      ? "bg-[#e7f0df] text-[#2d5a1a] border-[#c9d8bd]"
      : tone === "info"
      ? "bg-[#e8f2fd] text-[#1c64b0] border-[#c9d9f0]"
      : "bg-[#f4f1ea] text-[#2c2c2c] border-[#e5e5e5]";

  return (
    <div
      className={`flex flex-col gap-1 rounded-[14px] border px-4 py-3 shadow-inner ${toneClasses}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {helper ? <p className="text-xs text-[#6b6b6b]">{helper}</p> : null}
    </div>
  );
}

async function PendingInviteCount({ userId }: { userId: string }) {
  const invites = await prisma.journeyVratmitra.count({
    where: { status: "PENDING", userId },
  });
  return invites;
}
