"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VratmitraStatusDisplay } from "./vratmitra-status-display";
import { InviteVratmitraForm } from "./invite-vratmitra-form";
import { ExposureForm } from "./exposure-form";
import { ExposuresSection } from "./exposures-section";
import { ReflectionForm } from "./reflection-form";
import { ReflectionHistory } from "./reflection-history";
import { pauseJourneyAction, resumeJourneyAction, completeJourneyAction } from "@/app/actions/journey";
import { detachVratmitraAction } from "@/app/actions/vratmitra";

type JourneyState = "ACTIVE" | "INACTIVE" | "COMPLETED";

type ClarificationLink = {
  id: string;
  assessmentId: string;
  virtueRelationNote: string | null;
  lacunaReductionNote: string | null;
  unifiedInsightNote: string | null;
  personalContextNote: string | null;
  irrationalBelief: string | null;
  assessment: {
    id: string;
    lacuna: { nameEn: string; nameMr: string };
  };
};

type Resolution = {
  id: string;
  text: string;
  frequency: string;
  createdAt: Date;
};

type Exposure = {
  id: string;
  description: string;
  contextNote: string | null;
  createdAt: Date;
};

type Reflection = {
  id: string;
  applied: boolean;
  contextNote: string | null;
  insightNote: string | null;
  difficulty: number | null;
  date: Date;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: Date;
    userId: string;
    user: { name: string; email: string | null };
  }>;
};

type VratmitraLink = {
  id: string;
  status: string;
  acceptedAt: Date | null;
  detachedAt: Date | null;
  user: { name: string; email: string | null };
};

interface JourneyContentProps {
  journey: {
    id: string;
    userId: string;
    user: { id: string; name: string; email: string | null };
    createdAt: Date;
    state: JourneyState;
    sentence: {
      textEn: string;
      textMr: string;
      subVirtue: { nameEn: string; nameMr: string; virtue?: { nameEn?: string } | null };
    };
    links: ClarificationLink[];
    resolutions: Resolution[];
  };
  reflections: Reflection[];
  todayReflection: Reflection | null;
  activeVratmitra: VratmitraLink | null;
  detachedVratmitras: VratmitraLink[];
  exposures: Exposure[];
  isOwner: boolean;
  isVratmitra: boolean;
  currentUserId: string;
}

export function JourneyContent({
  journey,
  reflections,
  todayReflection,
  activeVratmitra,
  detachedVratmitras,
  exposures,
  isOwner,
  isVratmitra,
  currentUserId,
}: JourneyContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const normalizedReflections = reflections.map((r) => ({
    ...r,
    date: new Date(r.date),
    comments: (r.comments || []).map((c) => ({ ...c, createdAt: new Date(c.createdAt) })),
  }));

  const reflectionCount = normalizedReflections.length;
  const hasClarifications = journey.links.some(
    (link) =>
      link.virtueRelationNote ||
      link.lacunaReductionNote ||
      link.unifiedInsightNote ||
      link.personalContextNote ||
      link.irrationalBelief
  );

  const statusTone: "active" | "paused" | "completed" =
    journey.state === "ACTIVE" ? "active" : journey.state === "INACTIVE" ? "paused" : "completed";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "clarity", label: "Clarity" },
    { id: "resolutions", label: "Resolutions" },
    { id: "exposures", label: "Exposures" },
    { id: "reflections", label: "Reflections" },
    { id: "support", label: "Support" },
  ];

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to pause journey:", error);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Mark this journey as completed? You can still view it, but won't be able to edit it.")) return;
    setIsLoading(true);
    try {
      await completeJourneyAction(journey.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete journey:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {(isVratmitra && !isOwner) && (
        <div className="rounded-lg border border-[#c0d6f5] bg-[#e8f2fd] px-4 py-3 text-sm text-[#1c64b0]">
          <strong>Supporting as Vratmitra:</strong> You&apos;re viewing {journey.user.name}&apos;s journey. You can read all details and leave supportive comments.
        </div>
      )}

      <Tabs tabs={tabs} activeId={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <Card className="shadow-soft">
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Badge tone={statusTone}>{journey.state}</Badge>
                <h3 className="text-2xl font-bold text-[#2c2c2c]">{journey.sentence.textEn}</h3>
                <p className="text-sm text-[#6b6b6b]">{journey.sentence.textMr}</p>
                <p className="text-xs text-[#6b6b6b]">
                  {journey.sentence.subVirtue.nameEn} • Started {journey.createdAt.toLocaleDateString()} • {reflectionCount} reflection{reflectionCount !== 1 ? "s" : ""}
                </p>
              </div>
              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  {journey.state === "ACTIVE" && (
                    <>
                      <Button variant="outline" onClick={handlePause} loading={isLoading}>
                        Pause Journey
                      </Button>
                      <Button variant="primary" onClick={handleComplete} loading={isLoading} disabled={reflectionCount === 0}>
                        Mark as Completed
                      </Button>
                    </>
                  )}
                  {journey.state === "INACTIVE" && (
                    <Button variant="secondary" onClick={handleResume} loading={isLoading}>
                      Resume Journey
                    </Button>
                  )}
                  {journey.state === "COMPLETED" && <Badge tone="completed">Completed</Badge>}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoTile title="State" value={journey.state} />
              <InfoTile title="Clarity" value={hasClarifications ? "Documented" : "Pending"} helper="Clarifications unlock practice" />
              <InfoTile
                title="Practice"
                value={`${journey.resolutions.length} resolution${journey.resolutions.length !== 1 ? "s" : ""}`}
                helper="Define steady actions"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "clarity" && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Clarity</CardTitle>
            <CardDescription>Why this sentence matters to your work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {journey.links.length === 0 ? (
              <p className="text-sm text-[#6b6b6b]">No assessments linked yet.</p>
            ) : (
              journey.links.map((link) => (
                <div key={link.id} className="rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#2c2c2c]">{link.assessment.lacuna.nameEn}</p>
                    {isOwner && journey.state === "ACTIVE" && (
                      <Link href={`/journeys/${journey.id}/clarify/${link.assessmentId}`} className="text-sm font-semibold text-[#56723f] hover:text-[#6b8e4e]">
                        Edit Clarification
                      </Link>
                    )}
                  </div>
                  <ClarificationNote label="Relation to inner work" value={link.virtueRelationNote} />
                  <ClarificationNote label="Reduces lacuna" value={link.lacunaReductionNote} />
                  <ClarificationNote label="Unified insight" value={link.unifiedInsightNote} />
                  <ClarificationNote label="Personal context" value={link.personalContextNote} />
                  <ClarificationNote label="Core irrational belief" value={link.irrationalBelief || undefined} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "resolutions" && (
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Resolutions</CardTitle>
              <CardDescription>Define your practice commitments.</CardDescription>
            </div>
            {isOwner && journey.state === "ACTIVE" && hasClarifications && (
              <Button asChild variant="primary" size="sm">
                <Link href={`/journeys/${journey.id}/resolutions`}>Add Resolution</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {journey.resolutions.length === 0 ? (
              <p className="text-sm text-[#6b6b6b]">Define your practice commitments here.</p>
            ) : (
              journey.resolutions.map((resolution) => (
                <div key={resolution.id} className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-3 py-2 shadow-sm">
                  <p className="font-semibold text-[#2c2c2c]">{resolution.text}</p>
                  <p className="text-xs text-[#6b6b6b]">Frequency: {resolution.frequency}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "exposures" && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Exposures</CardTitle>
            <CardDescription>Record intentional practice experiences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwner && journey.state === "ACTIVE" && <ExposureForm journeyId={journey.id} />}
            <ExposuresSection initialExposures={exposures} journeyId={journey.id} isOwner={isOwner && journey.state === "ACTIVE"} />
          </CardContent>
        </Card>
      )}

      {activeTab === "reflections" && (
        <Card className="shadow-soft">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Reflections</CardTitle>
              <CardDescription>Capture today&apos;s practice and revisit history.</CardDescription>
            </div>
            <Progress value={Math.min(reflectionCount * 5, 100)} />
          </CardHeader>
          <CardContent className="space-y-6">
            {isOwner && (
              <div className="rounded-[16px] border border-[#e5e5e5] bg-[#f7f4ed] p-4 shadow-inner">
                <ReflectionForm
                  journeyId={journey.id}
                  existingReflection={todayReflection || undefined}
                  journeyState={journey.state}
                />
              </div>
            )}

            <div>
              <h4 className="text-base font-semibold text-[#2c2c2c] mb-2">Reflection history ({reflectionCount})</h4>
              <ReflectionHistory
                reflections={normalizedReflections}
                canComment={isOwner || isVratmitra}
                currentUserId={currentUserId}
                journeyOwnerId={journey.userId}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "support" && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Support</CardTitle>
            <CardDescription>Manage companions for this journey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeVratmitra ? (
              <div className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner">
                <p className="font-semibold text-[#2c2c2c]">{activeVratmitra.user.name}</p>
                <p className="text-sm text-[#6b6b6b]">{activeVratmitra.user.email}</p>
                <p className="text-xs text-[#6b6b6b] mt-1">
                  Supporting since {activeVratmitra.acceptedAt ? activeVratmitra.acceptedAt.toLocaleDateString() : "recently"}
                </p>
                {isOwner && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setIsLoading(true);
                        await detachVratmitraAction(journey.id);
                        setIsLoading(false);
                        router.refresh();
                      }}
                    >
                      Detach Vratmitra
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6b6b6b]">No active Vratmitra.</p>
            )}

            {isOwner && !activeVratmitra && (
              <div className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner">
                <h4 className="font-semibold text-[#2c2c2c] mb-2">Invite Vratmitra</h4>
                <InviteVratmitraForm journeyId={journey.id} />
              </div>
            )}

            {detachedVratmitras.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-[#2c2c2c]">Past Vratmitras</h4>
                {detachedVratmitras.map((v) => (
                  <div key={v.id} className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f4ed] px-3 py-2 text-sm text-[#2c2c2c] shadow-inner">
                    <p className="font-semibold">{v.user.name}</p>
                    <p className="text-xs text-[#6b6b6b]">
                      Supported until {v.detachedAt ? v.detachedAt.toLocaleDateString() : "past"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClarificationNote({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">{label}</p>
      <p className="text-sm text-[#2c2c2c]">{value}</p>
    </div>
  );
}

function InfoTile({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f7f4ed] px-4 py-3 shadow-inner">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b6b6b]">{title}</p>
      <p className="text-sm font-semibold text-[#2c2c2c]">{value}</p>
      {helper ? <p className="text-xs text-[#6b6b6b]">{helper}</p> : null}
    </div>
  );
}
