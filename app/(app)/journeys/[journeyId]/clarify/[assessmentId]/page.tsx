import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClarificationForm } from "./clarification-form";

interface ClarifyPageProps {
  params: Promise<{ journeyId: string; assessmentId: string }>;
}

export default async function ClarifyPage(props: ClarifyPageProps) {
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
    },
  });

  if (!journey) {
    redirect("/dashboard");
  }

  // Verify ownership
  if (journey.userId !== session.userId) {
    redirect("/dashboard");
  }

  // Get assessment and lacuna
  const assessment = await prisma.lacunaAssessment.findUnique({
    where: { id: params.assessmentId },
    include: {
      lacuna: true,
    },
  });

  if (!assessment) {
    redirect(`/journeys/${journey.id}`);
  }

  // Verify ownership
  if (assessment.userId !== session.userId) {
    redirect("/dashboard");
  }

  // Get existing clarification if any
  const existingLink = await prisma.sentenceJourneyAssessmentLink.findUnique({
    where: {
      journeyId_assessmentId: {
        journeyId: journey.id,
        assessmentId: assessment.id,
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Understand Your Work
        </h2>
        <p className="text-gray-600">
          Take time to deeply reflect on how this sentence connects to your growth.
          Your clarity here will guide your resolutions.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Context Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wide mb-1">
              Sentence
            </p>
            <p className="font-bold text-gray-900">{journey.sentence.textEn}</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs text-green-700 font-bold uppercase tracking-wide mb-1">
              Lacuna (Gap)
            </p>
            <p className="font-bold text-gray-900">{assessment.lacuna.nameEn}</p>
          </div>
        </div>

        {/* Clarification Form */}
        <ClarificationForm
          journeyId={journey.id}
          assessmentId={assessment.id}
          sentenceName={journey.sentence.textEn}
          lacunaName={assessment.lacuna.nameEn}
          subVirtueName={journey.sentence.subVirtue.nameEn}
          existingClarification={existingLink || undefined}
        />
      </div>
    </div>
  );
}
