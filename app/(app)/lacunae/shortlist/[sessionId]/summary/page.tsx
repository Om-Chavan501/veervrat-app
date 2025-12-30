import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SummaryUI } from "../../summary-ui";

interface SummaryPageProps {
  params: {
    sessionId: string;
  };
}

export default async function SummaryPage({
  params,
}: SummaryPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { sessionId } = await params;

  // Get shortlist session with items
  const shortlistSession = await prisma.lacunaShortlistSession.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        include: {
          lacuna: true,
        },
      },
    },
  });

  if (!shortlistSession) {
    redirect("/lacunae");
  }

  if (shortlistSession.userId !== session.userId) {
    redirect("/lacunae");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Review Shortlist
      </h2>
      <p className="text-gray-600 mb-8">
        You've selected {shortlistSession.items.length} lacunae to work on.
        Choose one to start its assessment.
      </p>

      <SummaryUI sessionId={sessionId} items={shortlistSession.items} />
    </div>
  );
}
