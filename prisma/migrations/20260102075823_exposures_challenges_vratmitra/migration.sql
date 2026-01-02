-- CreateEnum
CREATE TYPE "GovernanceStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('APPLIED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AdminRole" (
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "JourneyVratmitra" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detachedAt" TIMESTAMP(3),

    CONSTRAINT "JourneyVratmitra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExposureInstance" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contextNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExposureInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityExposure" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "governance" "GovernanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExposureRecommendation" (
    "id" TEXT NOT NULL,
    "exposureId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "recommendedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExposureRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityResolution" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "governance" "GovernanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionRecommendation" (
    "id" TEXT NOT NULL,
    "resolutionId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "recommendedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResolutionRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeInstance" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL,
    "applicationNote" TEXT,
    "approvalNote" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityChallenge" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "governance" "GovernanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JourneyVratmitra_journeyId_userId_key" ON "JourneyVratmitra"("journeyId", "userId");

-- AddForeignKey
ALTER TABLE "AdminRole" ADD CONSTRAINT "AdminRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyVratmitra" ADD CONSTRAINT "JourneyVratmitra_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyVratmitra" ADD CONSTRAINT "JourneyVratmitra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureInstance" ADD CONSTRAINT "ExposureInstance_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityExposure" ADD CONSTRAINT "CommunityExposure_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRecommendation" ADD CONSTRAINT "ExposureRecommendation_exposureId_fkey" FOREIGN KEY ("exposureId") REFERENCES "CommunityExposure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityResolution" ADD CONSTRAINT "CommunityResolution_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionRecommendation" ADD CONSTRAINT "ResolutionRecommendation_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "CommunityResolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeInstance" ADD CONSTRAINT "ChallengeInstance_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SentenceJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityChallenge" ADD CONSTRAINT "CommunityChallenge_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
