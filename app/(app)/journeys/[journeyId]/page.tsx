import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { JourneyContent } from "./journey-content";
import { ReflectionForm } from "./reflection-form";
import { ReflectionHistory } from "./reflection-history";
import { getTodayReflectionAction, getReflectionsAction } from "@/app/actions/reflection";
import { getActiveVratmitraAction } from "@/app/actions/vratmitra";
import { getExposuresAction } from "@/app/actions/exposure";
import { VratmitraStatusDisplay } from "./vratmitra-status-display";
import { InviteVratmitraForm } from "./invite-vratmitra-form";
import { ExposureForm } from "./exposure-form";
import { ExposuresSection } from "./exposures-section";

interface JourneyPageProps {
  params: Promise<{ journeyId: string }>;
}

export default async function JourneyPage(props: JourneyPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await props.params;

  // Get journey with all related data
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

  // Verify ownership
  if (journey.userId !== session.userId) {
    redirect("/dashboard");
  }

  // Get reflections for this journey
  const reflections = await getReflectionsAction(journey.id);
  const todayReflection = await getTodayReflectionAction(journey.id);
  const activeVratmitra = await getActiveVratmitraAction(journey.id);
  const exposures = await getExposuresAction(journey.id);

  const statusColor =
    journey.state === "ACTIVE"
      ? "bg-green-100 text-green-800"
      : journey.state === "INACTIVE"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  const statusLabel =
    journey.state === "ACTIVE"
      ? "Active"
      : journey.state === "INACTIVE"
      ? "Paused"
      : "Completed";

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">
            {journey.sentence.textEn}
          </h2>
          <span className={`px-3 py-1 rounded-full font-bold text-sm ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-gray-600">{journey.sentence.textMr}</p>
        <p className="text-sm text-gray-500 mt-2">
          <span className="font-medium">{journey.sentence.subVirtue.nameEn}</span>
          {" • "}
          Started {journey.createdAt.toLocaleDateString()}
          {reflections.length > 0 && ` • ${reflections.length} reflection${reflections.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <JourneyContent
        journey={journey}
        userId={session.userId}
        reflectionsCount={reflections.length}
      />

      {/* Vratmitra Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Vratmitra (Companion)
          </h3>
          <p className="text-sm text-gray-600">
            Invite a trusted companion to support your journey.
          </p>
        </div>

        <div className="space-y-6">
          {activeVratmitra ? (
            <VratmitraStatusDisplay
              vratmitra={activeVratmitra}
              journeyId={journey.id}
              isJourneyOwner={true}
            />
          ) : null}

          {!activeVratmitra && (
            <InviteVratmitraForm journeyId={journey.id} />
          )}
        </div>
      </section>

      {/* Exposures Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Exposures
          </h3>
          <p className="text-sm text-gray-600">
            Log your intentional experiences and practice attempts.
          </p>
        </div>

        <div className="space-y-6">
          <ExposureForm journeyId={journey.id} />
          <ExposuresSection
            initialExposures={exposures}
            journeyId={journey.id}
            isOwner={true}
          />
        </div>
      </section>

      {/* Reflection Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Today's Reflection
          </h3>
          <p className="text-sm text-gray-600">
            {journey.state === "ACTIVE"
              ? "Log your practice and insights from today."
              : "Journey is not active. Reflections are locked."}
          </p>
        </div>

        <div className="mb-8">
          <ReflectionForm
            journeyId={journey.id}
            existingReflection={todayReflection || undefined}
            journeyState={journey.state}
          />
        </div>

        {/* Reflection History */}
        <div>
          <h4 className="text-base font-bold text-gray-900 mb-4">
            Reflection History
          </h4>
          <ReflectionHistory reflections={reflections} />
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
