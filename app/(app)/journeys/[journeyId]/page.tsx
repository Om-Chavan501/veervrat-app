import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { JourneyContent } from "./journey-content";

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
        </p>
      </div>

      <JourneyContent
        journey={journey}
        userId={session.userId}
      />

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
