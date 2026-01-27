import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "@/lib/time";

export default async function VratmitraDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const links = await prisma.journeyVratmitra.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: {
      journey: {
        include: {
          sentence: { include: { subVirtue: true } },
          user: true,
        },
      },
    },
  });

  const journeyIds = links.map((l) => l.journeyId);

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

  const today = new Date();

  const supportedJourneys = links.map((link) => {
    const count = reflectionCountByJourney.get(link.journeyId) ?? 0;
    const last = lastReflectionByJourney.get(link.journeyId) ?? null;
    return { ...link, reflectionCount: count, lastReflection: last };
  });

  const staleSupported = supportedJourneys.filter((j) => {
    if (!j.lastReflection) return true;
    return daysBetween(j.lastReflection, today) > 7;
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-[#2c2c2c]">Vratmitra Dashboard</h2>
        <p className="text-sm text-[#6b6b6b]">Journeys you&apos;re supporting as a companion.</p>
      </header>

      {staleSupported.length > 0 && (
        <Card className="border border-[#f2d195] bg-[#fff6e0] shadow-soft">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>
              {staleSupported.length} journey{staleSupported.length > 1 ? "s" : ""} haven&apos;t been reflected on in over 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {staleSupported.map((item) => (
              <Link
                key={item.journeyId}
                href={`/journeys/${item.journeyId}`}
                className="text-sm font-semibold text-[#a35300] hover:text-[#6b8e4e]"
              >
                {item.journey.user.name}&apos;s journey: {truncate(item.journey.sentence.textEn, 50)}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {supportedJourneys.length === 0 ? (
        <EmptyState
          icon={<HandsIcon />}
          title="You’re not currently supporting anyone"
          description="Accept a Vratmitra invitation to begin supporting a journey."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {supportedJourneys.map((item) => {
            const staleness = getStaleness(item.lastReflection, today);
            const borderClass =
              staleness === "green"
                ? "border-l-4 border-l-[#6b8e4e]"
                : staleness === "yellow"
                ? "border-l-4 border-l-[#ffa726]"
                : staleness === "red"
                ? "border-l-4 border-l-[#e57373]"
                : "border-l-4 border-l-[#9e9e9e]";

            return (
              <Link
                key={item.id}
                href={`/journeys/${item.journeyId}`}
                className={`block rounded-[16px] border border-[#e5e5e5] bg-white p-5 shadow-card hover:border-[#6b8e4e] ${borderClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="info">{item.journey.user.name}</Badge>
                  <Badge tone="neutral">{item.reflectionCount} reflections</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#2c2c2c]">
                  {truncate(item.journey.sentence.textEn, 60)}
                </p>
                <p className="text-xs text-[#6b6b6b]">{item.journey.sentence.subVirtue.nameEn}</p>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Last reflection: {item.lastReflection ? formatDistanceToNow(item.lastReflection) : "Never"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getStaleness(lastReflection: Date | null, today: Date) {
  if (!lastReflection) return "gray";
  const days = daysBetween(lastReflection, today);
  if (days === 0) return "green";
  if (days <= 7) return "yellow";
  return "red";
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function truncate(text: string, len: number) {
  if (text.length <= len) return text;
  return `${text.slice(0, len)}...`;
}

function HandsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11V6.5a2.5 2.5 0 0 0-5 0V12a7 7 0 0 0 7 7h1" strokeLinecap="round" />
      <path d="M15 11V6.5a2.5 2.5 0 0 1 5 0V12a7 7 0 0 1-7 7h-1" strokeLinecap="round" />
    </svg>
  );
}
