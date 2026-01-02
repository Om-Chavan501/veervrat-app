-- CreateEnum
CREATE TYPE "VratmitraStatus" AS ENUM ('PENDING', 'ACTIVE', 'DETACHED');

-- AlterTable
ALTER TABLE "JourneyVratmitra" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "status" "VratmitraStatus" NOT NULL DEFAULT 'PENDING';
