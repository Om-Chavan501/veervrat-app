-- CreateTable
CREATE TABLE "ReflectionComment" (
    "id" TEXT NOT NULL,
    "reflectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReflectionComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReflectionComment_reflectionId_idx" ON "ReflectionComment"("reflectionId");

-- AddForeignKey
ALTER TABLE "ReflectionComment" ADD CONSTRAINT "ReflectionComment_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "DailyReflection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionComment" ADD CONSTRAINT "ReflectionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
