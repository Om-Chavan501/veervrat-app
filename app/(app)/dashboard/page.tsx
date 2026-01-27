import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PendingVratmitraInvitations } from "./pending-vratmitra-invitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionObserver } from "@/components/dashboard/section-observer";
import { formatDistanceToNow } from "@/lib/time";

type JourneyStaleness = "green" | "yellow" | "red" | "gray";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    inProgressAssessments,
    activeJourneys,
    pendingInvites,
    reflectionsThisWeek,
    reflectionMeta,
    recentReflections,
    recentJourneys,
    recentCompletedAssessments,
    recentVratmitraAccepted,
  ] = await Promise.all([
    prisma.lacunaAssessment.findMany({
      where: { userId: session.userId, status: "IN_PROGRESS" },
      include: {
        lacuna: {
          include: {
            lacunaSubVirtues: {
              include: { subVirtue: { include: { sentences: true } } },
            },
          },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
    prisma.sentenceJourney.findMany({
      where: { userId: session.userId, state: "ACTIVE" },
      include: {
        sentence: { include: { subVirtue: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.journeyVratmitra.count({
      where: { userId: session.userId, status: "PENDING" },
    }),
    prisma.dailyReflection.count({
      where: {
        journey: { userId: session.userId },
        date: { gte: sevenDaysAgo },
      },
    }),
    prisma.dailyReflection.groupBy({
      by: ["journeyId"],
      where: { journey: { userId: session.userId } },
      _count: { _all: true },
      _max: { date: true },
    }),
    prisma.dailyReflection.findMany({
      where: { journey: { userId: session.userId } },
      include: { journey: { include: { sentence: true } } },
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.sentenceJourney.findMany({
      where: { userId: session.userId },
      include: { sentence: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.lacunaAssessment.findMany({
      where: { userId: session.userId, status: "COMPLETED" },
      include: { lacuna: true },
      orderBy: { completedAt: "desc" },
      take: 2,
    }),
    prisma.journeyVratmitra.findMany({
      where: { userId: session.userId, status: "ACTIVE" },
      include: {
        journey: { include: { sentence: true, user: true } },
      },
      orderBy: { acceptedAt: "desc" },
      take: 2,
    }),
  ]);

  const reflectionCountByJourney = new Map<string, number>();
  const lastReflectionByJourney = new Map<string, Date | null>();

  reflectionMeta.forEach((meta) => {
    reflectionCountByJourney.set(meta.journeyId, meta._count._all);
    lastReflectionByJourney.set(meta.journeyId, meta._max.date);
  });

  const staleJourneys = activeJourneys.filter((journey) => {
    const last = lastReflectionByJourney.get(journey.id);
    if (!last) return true;
    const days = daysBetween(last, today);
    return days > 7;
  });

  const showNeedsAttention =
    pendingInvites > 0 || inProgressAssessments.length > 0 || staleJourneys.length > 0;

  const hero = buildHero({
    pendingInvites,
    inProgressAssessments,
    activeJourneys,
    reflectionsThisWeek,
  });

  const activity = buildRecentActivity({
    reflections: recentReflections,
    journeys: recentJourneys,
    assessments: recentCompletedAssessments,
    invites: recentVratmitraAccepted,
  }).slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionObserver sectionIds={["hero", "attention", "journeys", "invitations", "assessments", "activity"]} />

      <section className="card shadow-soft" data-section="hero" id="hero">
        <div className="flex flex-col items-start gap-4 p-6 text-left md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">{hero.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-[#2c2c2c]">{hero.metric}</p>
              <p className="text-lg text-[#6b6b6b]">{hero.metricLabel}</p>
            </div>
            <p className="mt-2 text-sm text-[#4a4a4a]">{hero.message}</p>
            <div className="mt-4">
              <Button asChild variant="primary" size="lg">
                <Link href={hero.actionHref}>{hero.actionLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showNeedsAttention && (
        <section data-section="attention">
          <Card className="border border-[#f2d195] bg-[#fff6e0] shadow-soft">
            <CardHeader>
              <CardTitle>🔔 Needs Your Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#4a4a4a]">
              {pendingInvites > 0 && (
                <AttentionItem href="#invitations" text={`${pendingInvites} pending Vratmitra invitation${pendingInvites > 1 ? "s" : ""}`} />
              )}
              {inProgressAssessments.length > 0 && (
                <AttentionItem
                  href="#assessments"
                  text={`${inProgressAssessments.length} assessment${inProgressAssessments.length > 1 ? "s" : ""} in progress`}
                />
              )}
              {staleJourneys.length > 0 && (
                <AttentionItem
                  href="#journeys"
                  text={`${staleJourneys.length} journey${staleJourneys.length > 1 ? "s" : ""} need reflection`}
                />
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-section="journeys" id="journeys">
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Active Journeys</CardTitle>
              <CardDescription>Focus on the journeys that move you forward.</CardDescription>
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
              activeJourneys.map((journey) => {
                const reflectionCount = reflectionCountByJourney.get(journey.id) ?? 0;
                const lastReflection = lastReflectionByJourney.get(journey.id);
                const staleness = getStaleness(lastReflection, today);
                const borderClass =
                  staleness === "green"
                    ? "border-l-4 border-l-[#6b8e4e]"
                    : staleness === "yellow"
                    ? "border-l-4 border-l-[#ffa726]"
                    : staleness === "red"
                    ? "border-l-4 border-l-[#e57373]"
                    : "border-l-4 border-l-[#9e9e9e]";

                const progressPercent = Math.min(reflectionCount * 5, 100);

                return (
                  <Link
                    key={journey.id}
                    href={`/journeys/${journey.id}`}
                    className={`group block rounded-[16px] border border-[#e5e5e5] bg-white px-5 py-4 shadow-card transition hover:-translate-y-0.5 hover:border-[#6b8e4e] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b8e4e] ${borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge tone="neutral" className="px-2 py-1 text-xs font-semibold">
                          {journey.sentence.subVirtue.nameEn}
                        </Badge>
                        <p className="text-base font-semibold text-[#2c2c2c]">
                          {journey.sentence.textEn.slice(0, 60)}
                          {journey.sentence.textEn.length > 60 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-3">
                          <Progress value={progressPercent} />
                          <span className="text-xs text-[#6b6b6b]">{reflectionCount} reflections</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft" data-section="invitations" id="invitations">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Companion Invitations</CardTitle>
              <CardDescription>Review requests to be a Vratmitra.</CardDescription>
            </div>
            <Badge tone="info" className="px-2 py-1 text-xs font-bold">
              {pendingInvites} pending
            </Badge>
          </CardHeader>
          <CardContent>
            <PendingVratmitraInvitations />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-section="assessments" id="assessments">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Assessments In Progress</CardTitle>
              <CardDescription>Resume where you left off.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressAssessments.length === 0 ? (
              <EmptyState
                icon={<ChecklistIcon />}
                title="No assessments in progress"
                description="Start a new assessment to discover focus areas."
                action={
                  <Button asChild variant="primary" size="sm">
                    <Link href="/lacunae">Start New Assessment</Link>
                  </Button>
                }
              />
            ) : (
              inProgressAssessments.map((assessment) => {
                const totalSentences = assessment.lacuna.lacunaSubVirtues.reduce(
                  (sum, lsv) => sum + lsv.subVirtue.sentences.length,
                  0
                );
                const answered = assessment._count.responses;
                return (
                  <div
                    key={assessment.id}
                    className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#2c2c2c]">
                          {assessment.lacuna.nameEn}
                        </p>
                        <p className="text-xs text-[#6b6b6b]">
                          Started {formatDistanceToNow(assessment.startedAt)}
                        </p>
                      </div>
                      <Badge tone="active">In Progress</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-[#4a4a4a]">
                      <span>
                        {answered}/{totalSentences} answered
                      </span>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/assessments/${assessment.id}`}>Resume Assessment</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section data-section="activity" id="activity">
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest steps in your practice.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? (
              <EmptyState
                icon={<SparkIcon />}
                title="No recent activity"
                description="Your recent actions will appear here."
              />
            ) : (
              activity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#2c2c2c] hover:border-[#6b8e4e]"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-xs text-[#6b6b6b]">{formatDistanceToNow(item.date)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AttentionItem({ href, text }: { href: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden>⚠️</span>
      <Link href={href} className="font-semibold text-[#a35300] hover:text-[#6b8e4e]">
        {text}
      </Link>
    </div>
  );
}

function buildHero({
  pendingInvites,
  inProgressAssessments,
  activeJourneys,
  reflectionsThisWeek,
}: {
  pendingInvites: number;
  inProgressAssessments: Array<{ id: string }>;
  activeJourneys: Array<{ id: string }>;
  reflectionsThisWeek: number;
}) {
  if (pendingInvites > 0) {
    return {
      metric: pendingInvites,
      metricLabel: "pending",
      label: "Pending Vratmitra Invitations",
      message: "Review and accept companion requests.",
      actionLabel: "View Invitations",
      actionHref: "#invitations",
    };
  }

  if (inProgressAssessments.length > 0) {
    return {
      metric: inProgressAssessments.length,
      metricLabel: "in progress",
      label: "Assessments",
      message: "Complete your started assessments.",
      actionLabel: "Resume Assessment",
      actionHref: `/assessments/${inProgressAssessments[0].id}`,
    };
  }

  if (activeJourneys.length > 0) {
    return {
      metric: reflectionsThisWeek,
      metricLabel: "this week",
      label: "Reflections",
      message: reflectionsThisWeek > 0 ? "Keep up the practice!" : "No reflections yet this week.",
      actionLabel: "Log Reflection",
      actionHref: `/journeys/${activeJourneys[0].id}`,
    };
  }

  return {
    metric: 0,
    metricLabel: "journeys",
    label: "Begin",
    message: "Start with an assessment to begin your practice.",
    actionLabel: "Start Assessment",
    actionHref: "/lacunae",
  };
}

function getStaleness(lastReflection: Date | null | undefined, today: Date): JourneyStaleness {
  if (!lastReflection) return "gray";
  const days = daysBetween(lastReflection, today);
  if (days === 0) return "green";
  if (days >= 1 && days <= 7) return "yellow";
  return "red";
}

function daysBetween(a: Date, b: Date) {
  const diff = b.getTime() - a.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type ActivityItem = { id: string; label: string; href: string; date: Date; icon: string };

function buildRecentActivity({
  reflections,
  journeys,
  assessments,
  invites,
}: {
  reflections: Array<{ id: string; date: Date; journeyId: string; journey: { sentence: { textEn: string } } }>;
  journeys: Array<{ id: string; createdAt: Date; sentence: { textEn: string } }>;
  assessments: Array<{ id: string; completedAt: Date | null; lacuna: { nameEn: string } }>;
  invites: Array<{ id: string; acceptedAt: Date | null; journey: { id: string; sentence: { textEn: string }; user: { name: string } } }>;
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  reflections.forEach((r) => {
    items.push({
      id: `reflection-${r.id}`,
      label: `📝 Logged reflection on "${truncate(r.journey.sentence.textEn, 36)}"`,
      href: `/journeys/${r.journeyId ?? ""}`,
      date: r.date,
      icon: "📝",
    });
  });

  journeys.forEach((j) => {
    items.push({
      id: `journey-${j.id}`,
      label: `➡️ Started journey: ${truncate(j.sentence.textEn, 42)}`,
      href: `/journeys/${j.id}`,
      date: j.createdAt,
      icon: "➡️",
    });
  });

  assessments.forEach((a) => {
    if (!a.completedAt) return;
    items.push({
      id: `assessment-${a.id}`,
      label: `✓ Completed ${a.lacuna.nameEn} assessment`,
      href: `/assessment-results/${a.id}`,
      date: a.completedAt,
      icon: "✓",
    });
  });

  invites.forEach((inv) => {
    if (!inv.acceptedAt) return;
    items.push({
      id: `invite-${inv.id}`,
      label: `🤝 Accepted Vratmitra for ${inv.journey.user.name}`,
      href: `/journeys/${inv.journey.id}`,
      date: inv.acceptedAt,
      icon: "🤝",
    });
  });

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
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

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 2 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
