import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShortlistUI } from "../../shortlist-ui";

interface ShortlistPageProps {
  params: {
    sessionId: string;
  };
}

export default async function ShortlistPage({
  params,
}: ShortlistPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { sessionId } = await params;

  // Get shortlist session
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

  // Get all lacunae with their selection status
  const allLacunae = await prisma.lacuna.findMany({
    orderBy: { category: "asc" },
  });

  const shortlistedIds = new Set(
    shortlistSession.items.map((item) => item.lacunaId)
  );

  const lacunaeWithStatus = allLacunae.map((lacuna) => ({
    ...lacuna,
    isSelected: shortlistedIds.has(lacuna.id),
  }));

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Shortlist Lacunae
      </h2>
      <p className="text-gray-600 mb-8">
        Select which internal weaknesses you want to work on. You can select
        multiple lacunae from each category.
      </p>

      <ShortlistUI
        sessionId={sessionId}
        allLacunae={lacunaeWithStatus}
        initialShortlist={shortlistSession.items}
      />
    </div>
  );
}
