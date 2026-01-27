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
import { EmptyState } from "@/components/ui/empty-state";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { SectionObserver } from "@/components/dashboard/section-observer";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [assessments, journeys, totalAssessmentCount, totalJourneyCount, reflectionsThisWeek] =
    await Promise.all([
      prisma.lacunaAssessment.findMany({
        where: { userId: session.userId },
        include: {
          lacuna: true,
        },
        orderBy: { startedAt: "desc" },
        take: 6,
      }),
      prisma.sentenceJourney.findMany({
        where: { userId: session.userId },
        include: {
          sentence: {
            include: {
              subVirtue: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.lacunaAssessment.count({ where: { userId: session.userId } }),
      prisma.sentenceJourney.count({ where: { userId: session.userId } }),
      prisma.dailyReflection.count({
        where: {
          journey: { userId: session.userId },
          date: { gte: sevenDaysAgo },
        },
      }),
    ]);

  const activeAssessments = assessments.filter((a) => a.status === "IN_PROGRESS");
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");

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

  const showWelcome = totalJourneyCount === 0 && totalAssessmentCount === 0;
  const showHeaderProgress = activeJourneys.length > 0;

  return (
    <div className="space-y-10">
      <SectionObserver sectionIds={["hero", "journeys", "invitations", "assessments", "archive", "profile"]} />

      {showWelcome && <WelcomeBanner userName={session.name} shouldShow={showWelcome} />}

      <section className="card shadow-soft" data-section="hero" id="hero">
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
        {showHeaderProgress && (
          <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5] bg-white/70 px-6 py-3 text-sm text-[#4a4a4a]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f7f4ed] px-3 py-1">
              <span className="status-dot bg-[#6b8e4e]" aria-hidden />
              {activeJourneys.length} journeys active
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f7f4ed] px-3 py-1">
              <span className="status-dot bg-[#c47b5c]" aria-hidden />
              {reflectionsThisWeek} reflections this week
            </span>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-section="journeys" id="journeys">
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
                icon={<CompassIcon />}
                title="Ready to begin your first journey?"
                description="Complete an assessment to discover which sentence to work with."
                action={
                  <Button asChild variant="primary" size="sm">
                    <Link href="/lacunae">Take Assessment</Link>
                  </Button>
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
                          {journey.sentence.textEn.length > 80 ? "..." : ""}
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

        <Card className="shadow-soft" data-section="invitations">
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3" data-section="assessments">
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
                icon={<ChecklistIcon />}
                title="No assessments yet"
                description="Assessments help you identify your growth edges. They take 10–15 minutes."
                action={
                  <Button asChild variant="primary" size="sm">
                    <Link href="/lacunae">Start Your First Assessment</Link>
                  </Button>
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
            <CardTitle>What You Can Do Now</CardTitle>
            <CardDescription>Step back in whenever you are ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionButton
              href="/lacunae"
              label={showWelcome ? "1. Start Assessment" : "Start Assessment"}
              icon={<PlayIcon />}
              tone="primary"
            />
            <ActionButton
              href="/dashboard#assessments"
              label={showWelcome ? "2. Review Results" : "Review Results"}
              icon={<ListIcon />}
              tone="secondary"
            />
            <ActionButton
              href="/dashboard#journeys"
              label={showWelcome ? "3. Begin Journey" : "Begin Journey"}
              icon={<CompassIcon />}
              tone="subtle"
            />
            <ActionButton
              href="/dashboard#journeys"
              label={showWelcome ? "4. Daily Practice" : "Daily Practice"}
              icon={<CalendarIcon />}
              tone="subtle"
            />
          </CardContent>
        </Card>
      </section>

      <section data-section="archive">
        <details className="rounded-[16px] border border-[#e5e5e5] bg-white shadow-card">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-[#2c2c2c]">
            {completedJourneys.length} completed journeys
            <ChevronIcon />
          </summary>
          <div className="space-y-3 px-5 pb-5">
            {completedJourneys.map((journey) => (
              <Link
                key={journey.id}
                href={`/journeys/${journey.id}`}
                className="block rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#2c2c2c] shadow-inner hover:border-[#6b8e4e]"
              >
                {journey.sentence.textEn}
              </Link>
            ))}
          </div>
        </details>

        <details className="mt-4 rounded-[16px] border border-[#e5e5e5] bg-white shadow-card">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-[#2c2c2c]">
            {completedAssessments.length} completed assessments
            <ChevronIcon />
          </summary>
          <div className="space-y-3 px-5 pb-5">
            {completedAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/assessment-results/${assessment.id}`}
                className="block rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#2c2c2c] shadow-inner hover:border-[#6b8e4e]"
              >
                {assessment.lacuna.nameEn}
              </Link>
            ))}
          </div>
        </details>
      </section>

      <section id="profile" data-section="profile">
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

function StatPill({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number | React.ReactNode;
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

function ActionButton({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone: "primary" | "secondary" | "subtle";
}) {
  const variants: Record<"primary" | "secondary" | "subtle", string> = {
    primary: "bg-[#6b8e4e] text-white hover:bg-[#56723f]",
    secondary: "bg-[#c47b5c] text-white hover:bg-[#ab6447]",
    subtle: "bg-[#f7f4ed] text-[#2c2c2c] hover:border-[#6b8e4e] border",
  };
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm font-semibold transition ${variants[tone]}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-[#2c2c2c]" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

async function PendingInviteCount({ userId }: { userId: string }) {
  const invites = await prisma.journeyVratmitra.count({
    where: { status: "PENDING", userId },
  });
  return invites;
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 14.5 10 10l4.5-1.5L16 13z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 12 3 3 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12l-6 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h12M8 12h12M8 17h12" strokeLinecap="round" />
      <circle cx="4" cy="7" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="17" r="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6b6b6b]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
