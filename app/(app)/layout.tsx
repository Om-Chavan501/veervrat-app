import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { NavigationSidebar } from "@/components/navigation/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [activeJourneyCount, inProgressAssessments] = await Promise.all([
    prisma.sentenceJourney.count({
      where: { userId: session.userId, state: "ACTIVE" },
    }),
    prisma.lacunaAssessment.count({
      where: { userId: session.userId, status: "IN_PROGRESS" },
    }),
  ]);

  return (
    <div className="min-h-screen text-[#2c2c2c]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,#fff7ed,transparent_25%),radial-gradient(circle_at_80%_0%,#eaf0e2,transparent_28%),radial-gradient(circle_at_50%_80%,#f7ede4,transparent_32%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />

      <div className="relative flex min-h-screen">
        <NavigationSidebar
          userName={session.name}
          activeJourneyCount={activeJourneyCount}
        />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#e5e5e5] bg-white/80 backdrop-blur-lg">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Veervrat
                </p>
                <h1 className="text-xl font-bold text-[#2c2c2c]">
                  Slow, clear steps toward inner strength
                </h1>
                <p className="text-sm text-[#6b6b6b]">
                  Welcome back, {session.name}. Stay with the practice at your pace.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge tone="active" className="hidden sm:inline-flex">
                  {activeJourneyCount} active journeys
                </Badge>
                <Badge tone="info" className="hidden sm:inline-flex">
                  {inProgressAssessments} assessments in progress
                </Badge>
                <form action={logoutAction}>
                  <Button variant="outline" size="sm" type="submit">
                    Logout
                  </Button>
                </form>
              </div>

              <div className="flex w-full flex-wrap gap-2 lg:hidden">
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm font-semibold text-[#2c2c2c] shadow-card hover:border-[#6b8e4e] hover:text-[#56723f]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/lacunae"
                  className="flex-1 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm font-semibold text-[#2c2c2c] shadow-card hover:border-[#6b8e4e] hover:text-[#56723f]"
                >
                  Assessments
                </Link>
                <Link
                  href="/dashboard#journeys"
                  className="flex-1 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm font-semibold text-[#2c2c2c] shadow-card hover:border-[#6b8e4e] hover:text-[#56723f]"
                >
                  Journeys
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
