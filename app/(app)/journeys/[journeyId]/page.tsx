import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { JourneyContent } from "./journey-content";
import { getTodayReflectionAction, getReflectionsAction } from "@/app/actions/reflection";
import { getActiveVratmitraAction } from "@/app/actions/vratmitra";
import { getExposuresAction } from "@/app/actions/exposure";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface JourneyPageProps {
  params: Promise<{ journeyId: string }>;
}

export default async function JourneyPage(props: JourneyPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await props.params;

  const journey = await prisma.sentenceJourney.findUnique({
    where: { id: params.journeyId },
    include: {
      sentence: {
        include: {
          subVirtue: true,
        },
      },
      links: {
        include: {
          assessment: {
            include: {
              lacuna: true,
            },
          },
        },
      },
      resolutions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!journey) {
    return (
      <div className="text-center text-gray-600">
        <p>Journey not found</p>
      </div>
    );
  }

  if (journey.userId !== session.userId) {
    redirect("/dashboard");
  }

  const reflections = await getReflectionsAction(journey.id);
  const todayReflection = await getTodayReflectionAction(journey.id);
  const activeVratmitra = await getActiveVratmitraAction(journey.id);
  const exposures = await getExposuresAction(journey.id);

  const statusTone: "active" | "paused" | "completed" =
    journey.state === "ACTIVE"
      ? "active"
      : journey.state === "INACTIVE"
      ? "paused"
      : "completed";

  return (
    <div className="space-y-8">
      <Card className="shadow-soft">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="space-y-2">
            <Badge tone={statusTone as any} className="w-fit">
              {journey.state}
            </Badge>
            <h2 className="text-3xl font-bold text-[#2c2c2c]">{journey.sentence.textEn}</h2>
            <p className="text-sm text-[#6b6b6b]">{journey.sentence.textMr}</p>
            <p className="text-xs text-[#6b6b6b]">
              {journey.sentence.subVirtue.nameEn} • Started{" "}
              {journey.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 text-sm text-[#4a4a4a] shadow-inner">
            <p className="font-semibold text-[#2c2c2c]">Today</p>
            <p>
              {todayReflection
                ? "Reflection logged"
                : "No reflection yet — pause and note what you noticed today."}
            </p>
          </div>
        </div>
      </Card>

      <JourneyContent
        journey={journey}
        userId={session.userId}
        reflections={reflections}
        todayReflection={todayReflection}
        activeVratmitra={activeVratmitra}
        exposures={exposures}
      />

      <div className="mt-8">
        <Link
          href="/dashboard"
          className="text-[#56723f] hover:text-[#6b8e4e] font-semibold"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
