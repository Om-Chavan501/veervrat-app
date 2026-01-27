"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  pauseJourneyAction,
  resumeJourneyAction,
  completeJourneyAction,
} from "@/app/actions/journey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VratmitraStatusDisplay } from "./vratmitra-status-display";
import { InviteVratmitraForm } from "./invite-vratmitra-form";
import { ExposureForm } from "./exposure-form";
import { ExposuresSection } from "./exposures-section";
import { ReflectionForm } from "./reflection-form";
import { ReflectionHistory } from "./reflection-history";

type ClarificationLink = Journey["links"][number];
type Resolution = Journey["resolutions"][number];

type Reflection = {
  id: string;
  applied: boolean;
  contextNote: string | null;
  insightNote: string | null;
  difficulty: number | null;
  date: Date;
};

type ActiveVratmitra = {
  id: string;
  status: string;
  user: {
    name: string;
    email: string | null;
  };
} | null;

interface Journey {
  id: string;
  state: "ACTIVE" | "INACTIVE" | "COMPLETED";
  createdAt: Date;
  sentence: {
    textEn: string;
    textMr: string;
    subVirtue: {
      nameEn: string;
    };
  };
  links: Array<{
    id: string;
    assessmentId: string;
    virtueRelationNote: string | null;
    lacunaReductionNote: string | null;
    unifiedInsightNote: string | null;
    personalContextNote: string | null;
    irrationalBelief: string | null;
    assessment: {
      id: string;
      lacuna: {
        nameEn: string;
        nameMr: string;
      };
    };
  }>;
  resolutions: Array<{
    id: string;
    text: string;
    frequency: string;
    createdAt: Date;
  }>;
}

interface JourneyContentProps {
  journey: Journey;
  userId: string;
  reflections: Reflection[];
  todayReflection: Reflection | null;
  activeVratmitra: ActiveVratmitra;
  exposures: Array<{
    id: string;
    description: string;
    contextNote: string | null;
    createdAt: Date;
  }>;
}

export function JourneyContent({
  journey,
  reflections,
  todayReflection,
  activeVratmitra,
  exposures,
}: JourneyContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const reflectionCount = reflections.length;

  const hasClarifications = journey.links.some(
    (link) =>
      link.virtueRelationNote ||
      link.lacunaReductionNote ||
      link.unifiedInsightNote ||
      link.personalContextNote ||
      link.irrationalBelief
  );

  const statusTone: "active" | "paused" | "completed" =
    journey.state === "ACTIVE"
      ? "active"
      : journey.state === "INACTIVE"
      ? "paused"
      : "completed";

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to pause journey:", error);
      alert("Failed to pause journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      await resumeJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to resume journey:", error);
      alert("Failed to resume journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (
      !confirm(
        "Mark this journey as completed? You can still view it, but won't be able to edit it."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await completeJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete journey:", error);
      alert("Failed to complete journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      badge: <Badge tone={statusTone}>{journey.state}</Badge>,
    },
    {
      id: "clarity",
      label: "Clarity & Intent",
      badge: (
        <Badge tone={hasClarifications ? "success" : "warning"}>
          {hasClarifications ? "Clarified" : "Needs clarity"}
        </Badge>
      ),
    },
    {
      id: "practice",
      label: "Practice",
      badge: (
        <Badge tone="active">
          {journey.resolutions.length} resolution
          {journey.resolutions.length !== 1 ? "s" : ""}
        </Badge>
      ),
    },
    {
      id: "reflections",
      label: "Reflections",
      badge: <Badge tone="neutral">{reflectionCount} logged</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} activeId={activeTab} onTabChange={setActiveTab} />

      <div className="card rounded-[18px] border border-[#e5e5e5] bg-white/90 shadow-soft">
        {activeTab === "overview" && (
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Badge tone={statusTone}>{journey.state}</Badge>
                <h3 className="text-2xl font-bold text-[#2c2c2c]">
                  {journey.sentence.textEn}
                </h3>
                <p className="text-sm text-[#6b6b6b]">{journey.sentence.textMr}</p>
              </div>
              <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 text-sm text-[#4a4a4a] shadow-inner">
                <p className="font-semibold text-[#2c2c2c]">
                  {journey.sentence.subVirtue.nameEn}
                </p>
                <p>Started {journey.createdAt.toLocaleDateString()}</p>
                <p>
                  {reflectionCount} reflection{reflectionCount !== 1 ? "s" : ""} logged
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoTile title="State" value={journey.state} />
              <InfoTile
                title="Clarity"
                value={hasClarifications ? "Documented" : "Pending"}
                helper="Clarifications unlock practice"
              />
              <InfoTile
                title="Practice"
                value={`${journey.resolutions.length} resolution${journey.resolutions.length !== 1 ? "s" : ""}`}
                helper="Build consistency slowly"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {journey.state === "ACTIVE" && (
                <>
                  <Button variant="outline" onClick={handlePause} loading={isLoading}>
                    Pause journey
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleComplete}
                    loading={isLoading}
                    disabled={reflectionCount === 0}
                  >
                    Mark as completed
                  </Button>
                  {reflectionCount === 0 && (
                    <p className="text-xs text-[#a25a0f]">
                      Log at least one reflection before completing.
                    </p>
                  )}
                </>
              )}

              {journey.state === "INACTIVE" && (
                <Button variant="secondary" onClick={handleResume} loading={isLoading}>
                  Resume journey
                </Button>
              )}

              {journey.state === "COMPLETED" && (
                <Badge tone="completed">Completed</Badge>
              )}
            </div>
          </CardContent>
        )}

        {activeTab === "clarity" && (
          <CardContent className="space-y-5 pt-6">
            <CardTitle className="text-xl">Clarifications</CardTitle>
            <CardDescription className="text-sm">
              Build clarity on why this sentence matters to your work. Keep it brief but personal.
            </CardDescription>

            {journey.links.length === 0 ? (
              <EmptyBlock
                title="No assessments linked yet"
                description="Complete an assessment to anchor this journey."
              />
            ) : (
              <div className="space-y-4">
                {journey.links.map((link) => (
                  <ClarificationCard
                    key={link.id}
                    link={link}
                    journeyId={journey.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}

        {activeTab === "practice" && (
          <CardContent className="space-y-6 pt-6">
            <CardTitle className="text-xl">Practice</CardTitle>
            <CardDescription className="text-sm">
              Resolutions, exposures, and companion support to keep you grounded.
            </CardDescription>

            {journey.state === "ACTIVE" && hasClarifications ? (
              <ResolutionList resolutions={journey.resolutions} journeyId={journey.id} />
            ) : (
              <EmptyBlock
                title="Unlock practice by clarifying"
                description="Complete a clarification first to add resolutions."
              />
            )}

            <div className="rounded-[16px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2c2c2c]">Companion</p>
                  <p className="text-xs text-[#6b6b6b]">
                    Invite or review your Vratmitra for this journey.
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-4">
                {activeVratmitra ? (
                  <VratmitraStatusDisplay
                    vratmitra={activeVratmitra}
                    journeyId={journey.id}
                    isJourneyOwner={true}
                  />
                ) : (
                  <InviteVratmitraForm journeyId={journey.id} />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2c2c2c]">Exposures</p>
                <span className="text-xs text-[#6b6b6b]">
                  Log intentional experiences and attempts.
                </span>
              </div>
              <ExposureForm journeyId={journey.id} />
              <ExposuresSection
                initialExposures={exposures}
                journeyId={journey.id}
                isOwner={journey.state === "ACTIVE"}
              />
            </div>
          </CardContent>
        )}

        {activeTab === "reflections" && (
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">Reflections</CardTitle>
                <CardDescription className="text-sm">
                  Capture today&apos;s practice and revisit your history.
                </CardDescription>
              </div>
              <Progress value={Math.min(reflectionCount, 20)} max={20} />
            </div>

            <div className="rounded-[16px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
              <ReflectionForm
                journeyId={journey.id}
                existingReflection={todayReflection || undefined}
                journeyState={journey.state}
              />
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#2c2c2c] mb-2">
                Reflection history ({reflectionCount})
              </h4>
              <ReflectionHistory reflections={reflections} />
            </div>
          </CardContent>
        )}
      </div>
    </div>
  );
}

function ClarificationCard({ link, journeyId }: { link: ClarificationLink; journeyId: string }) {
  const isComplete =
    link.virtueRelationNote ||
    link.irrationalBelief ||
    link.lacunaReductionNote ||
    link.unifiedInsightNote ||
    link.personalContextNote;

  return (
    <div className="rounded-[14px] border border-[#e5e5e5] bg-gradient-to-br from-white to-[#f8f5ee] p-4 shadow-inner">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2c2c2c]">
            {link.assessment.lacuna.nameEn}
          </p>
          <p className="text-xs text-[#6b6b6b]">{link.assessment.lacuna.nameMr}</p>
        </div>
        <Badge tone={isComplete ? "success" : "warning"}>
          {isComplete ? "Clarified" : "Incomplete"}
        </Badge>
      </div>

      {isComplete ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {link.virtueRelationNote && <NoteBlock title="Relation to inner work" text={link.virtueRelationNote} />}
          {link.lacunaReductionNote && (
            <NoteBlock title="How it reduces the lacuna" text={link.lacunaReductionNote} />
          )}
          {link.unifiedInsightNote && <NoteBlock title="Unified insight" text={link.unifiedInsightNote} />}
          {link.personalContextNote && <NoteBlock title="Personal context" text={link.personalContextNote} />}
          {link.irrationalBelief && <NoteBlock title="Core irrational belief" text={link.irrationalBelief} />}
        </div>
      ) : (
        <div className="mt-3 rounded-[12px] border border-[#f2d195] bg-[#fff3d9] px-3 py-3 text-sm text-[#a25a0f]">
          Complete your clarification to unlock resolutions.
        </div>
      )}

      <div className="mt-3">
        <Link
          href={`/journeys/${journeyId}/clarify/${link.assessmentId}`}
          className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
        >
          {isComplete ? "Edit" : "Add"} Clarification →
        </Link>
      </div>
    </div>
  );
}

function NoteBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[12px] border border-[#e5e5e5] bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">{title}</p>
      <p className="text-sm text-[#2c2c2c]">{text}</p>
    </div>
  );
}

function ResolutionList({ resolutions, journeyId }: { resolutions: Resolution[]; journeyId: string }) {
  return (
    <div className="rounded-[14px] border border-[#e5e5e5] bg-white/80 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#2c2c2c]">
          {resolutions.length} active practice
          {resolutions.length !== 1 ? "s" : ""}
        </p>
        <Link
          href={`/journeys/${journeyId}/resolutions`}
          className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]"
        >
          Add / Edit
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {resolutions.map((resolution) => (
          <div
            key={resolution.id}
            className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-3 py-2 shadow-sm"
          >
            <p className="font-semibold text-[#2c2c2c]">{resolution.text}</p>
            <p className="text-xs text-[#6b6b6b]">Frequency: {resolution.frequency}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#d8d1c6] bg-[#faf6ef] px-4 py-5">
      <p className="text-sm font-semibold text-[#2c2c2c]">{title}</p>
      <p className="text-sm text-[#6b6b6b]">{description}</p>
    </div>
  );
}

function InfoTile({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 shadow-inner">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">{title}</p>
      <p className="text-sm font-semibold text-[#2c2c2c]">{value}</p>
      {helper ? <p className="text-xs text-[#6b6b6b]">{helper}</p> : null}
    </div>
  );
}
