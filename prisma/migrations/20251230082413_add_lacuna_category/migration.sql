-- CreateEnum
CREATE TYPE "JourneyState" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('ALWAYS', 'OFTEN', 'RARELY', 'NEVER');

-- CreateEnum
CREATE TYPE "IrrationalBelief" AS ENUM ('MUST_BE_LOVED', 'MUST_BE_COMPETENT', 'MUST_HAVE_COMFORT');

-- CreateEnum
CREATE TYPE "LacunaCategory" AS ENUM ('A', 'B', 'C');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lacuna" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "category" "LacunaCategory" NOT NULL,

    CONSTRAINT "Lacuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LacunaSubVirtue" (
    "id" TEXT NOT NULL,
    "lacunaId" TEXT NOT NULL,
    "subVirtueId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "LacunaSubVirtue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Virtue" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,

    CONSTRAINT "Virtue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubVirtue" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "virtueId" TEXT NOT NULL,

    CONSTRAINT "SubVirtue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textMr" TEXT NOT NULL,
    "subVirtueId" TEXT NOT NULL,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LacunaShortlistSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LacunaShortlistSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LacunaShortlistItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lacunaId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "LacunaShortlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LacunaAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lacunaId" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "shortlistSessionId" TEXT,

    CONSTRAINT "LacunaAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "rating" "Rating" NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestedSentenceSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "priorityRank" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "SuggestedSentenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "state" "JourneyState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inactiveAt" TIMESTAMP(3),
    "inactiveReason" TEXT,

    CONSTRAINT "SentenceJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceJourneyAssessmentLink" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "virtueRelationNote" TEXT,
    "lacunaReductionNote" TEXT NOT NULL,
    "unifiedInsightNote" TEXT NOT NULL,
    "personalContextNote" TEXT NOT NULL,
    "irrationalBelief" "IrrationalBelief" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentenceJourneyAssessmentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionInstance" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResolutionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReflection" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "applied" BOOLEAN NOT NULL,
    "contextNote" TEXT,
    "insightNote" TEXT,
    "difficulty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lacuna_nameEn_key" ON "Lacuna"("nameEn");

-- CreateIndex
CREATE INDEX "Lacuna_category_idx" ON "Lacuna"("category");

-- CreateIndex
CREATE UNIQUE INDEX "LacunaSubVirtue_lacunaId_subVirtueId_key" ON "LacunaSubVirtue"("lacunaId", "subVirtueId");

-- CreateIndex
CREATE UNIQUE INDEX "Virtue_nameEn_key" ON "Virtue"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "SubVirtue_nameEn_key" ON "SubVirtue"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Sentence_textEn_key" ON "Sentence"("textEn");

-- CreateIndex
CREATE UNIQUE INDEX "LacunaShortlistItem_sessionId_lacunaId_key" ON "LacunaShortlistItem"("sessionId", "lacunaId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_assessmentId_sentenceId_key" ON "AssessmentResponse"("assessmentId", "sentenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestedSentenceSnapshot_assessmentId_sentenceId_key" ON "SuggestedSentenceSnapshot"("assessmentId", "sentenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SentenceJourney_userId_sentenceId_key" ON "SentenceJourney"("userId", "sentenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SentenceJourneyAssessmentLink_journeyId_assessmentId_key" ON "SentenceJourneyAssessmentLink"("journeyId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReflection_journeyId_date_key" ON "DailyReflection"("journeyId", "date");

-- AddForeignKey
ALTER TABLE "LacunaSubVirtue" ADD CONSTRAINT "LacunaSubVirtue_lacunaId_fkey" FOREIGN KEY ("lacunaId") REFERENCES "Lacuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaSubVirtue" ADD CONSTRAINT "LacunaSubVirtue_subVirtueId_fkey" FOREIGN KEY ("subVirtueId") REFERENCES "SubVirtue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubVirtue" ADD CONSTRAINT "SubVirtue_virtueId_fkey" FOREIGN KEY ("virtueId") REFERENCES "Virtue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_subVirtueId_fkey" FOREIGN KEY ("subVirtueId") REFERENCES "SubVirtue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaShortlistSession" ADD CONSTRAINT "LacunaShortlistSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaShortlistItem" ADD CONSTRAINT "LacunaShortlistItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LacunaShortlistSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaShortlistItem" ADD CONSTRAINT "LacunaShortlistItem_lacunaId_fkey" FOREIGN KEY ("lacunaId") REFERENCES "Lacuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaAssessment" ADD CONSTRAINT "LacunaAssessment_shortlistSessionId_fkey" FOREIGN KEY ("shortlistSessionId") REFERENCES "LacunaShortlistSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaAssessment" ADD CONSTRAINT "LacunaAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LacunaAssessment" ADD CONSTRAINT "LacunaAssessment_lacunaId_fkey" FOREIGN KEY ("lacunaId") REFERENCES "Lacuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LacunaAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedSentenceSnapshot" ADD CONSTRAINT "SuggestedSentenceSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LacunaAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedSentenceSnapshot" ADD CONSTRAINT "SuggestedSentenceSnapshot_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceJourney" ADD CONSTRAINT "SentenceJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceJourney" ADD CONSTRAINT "SentenceJourney_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceJourneyAssessmentLink" ADD CONSTRAINT "SentenceJourneyAssessmentLink_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceJourneyAssessmentLink" ADD CONSTRAINT "SentenceJourneyAssessmentLink_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LacunaAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionInstance" ADD CONSTRAINT "ResolutionInstance_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReflection" ADD CONSTRAINT "DailyReflection_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
