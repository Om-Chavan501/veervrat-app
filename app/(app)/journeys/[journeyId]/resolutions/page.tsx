import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResolutionsContent } from "./resolutions-content";

interface ResolutionsPageProps {
  params: Promise<{ journeyId: string }>;
}

export default async function ResolutionsPage(props: ResolutionsPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await props.params;

  // Get journey
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
    redirect("/dashboard");
  }

  // Verify ownership
  if (journey.userId !== session.userId) {
    redirect("/dashboard");
  }

  // Check if journey is active
  if (journey.state !== "ACTIVE") {
    redirect(`/journeys/${journey.id}`);
  }

  // Check if clarification exists
  const hasClarification = journey.links.some(
    (link) =>
      link.virtueRelationNote ||
      link.lacunaReductionNote ||
      link.unifiedInsightNote ||
      link.personalContextNote ||
      link.irrationalBelief
  );

  if (!hasClarification) {
    redirect(`/journeys/${journey.id}`);
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {journey.sentence.textEn}
        </h2>
        <p className="text-gray-600">Add or edit your resolutions</p>
      </div>

      <ResolutionsContent
        journey={journey}
        userId={session.userId}
      />
    </div>
  );
}
