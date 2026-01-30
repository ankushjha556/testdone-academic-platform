-- CreateEnum
CREATE TYPE "MistakeType" AS ENUM ('CONCEPTUAL_ERROR', 'CALCULATION_ERROR', 'GUESSING_ERROR', 'TIME_PRESSURE_ERROR', 'REPEATED_ERROR');

-- CreateTable
CREATE TABLE "UserMistakeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptId" TEXT,
    "examId" TEXT,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "selectedOption" TEXT,
    "correctOption" TEXT NOT NULL,
    "mistakeType" "MistakeType",
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMistakeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeaknessSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weakSubjects" JSONB NOT NULL,
    "weakTopics" JSONB,
    "weakDifficulty" JSONB,
    "overallAccuracy" DOUBLE PRECISION NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "totalCorrect" INTEGER NOT NULL,
    "totalErrors" INTEGER NOT NULL,
    "accuracyTrend" JSONB,
    "improvementScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWeaknessSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMistakeLog_userId_idx" ON "UserMistakeLog"("userId");

-- CreateIndex
CREATE INDEX "UserMistakeLog_userId_subjectId_idx" ON "UserMistakeLog"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "UserMistakeLog_userId_questionId_idx" ON "UserMistakeLog"("userId", "questionId");

-- CreateIndex
CREATE INDEX "UserMistakeLog_userId_isCorrect_idx" ON "UserMistakeLog"("userId", "isCorrect");

-- CreateIndex
CREATE INDEX "UserMistakeLog_userId_createdAt_idx" ON "UserMistakeLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserMistakeLog_attemptId_idx" ON "UserMistakeLog"("attemptId");

-- CreateIndex
CREATE INDEX "UserWeaknessSnapshot_userId_idx" ON "UserWeaknessSnapshot"("userId");

-- CreateIndex
CREATE INDEX "UserWeaknessSnapshot_userId_snapshotDate_idx" ON "UserWeaknessSnapshot"("userId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "UserMistakeLog" ADD CONSTRAINT "UserMistakeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMistakeLog" ADD CONSTRAINT "UserMistakeLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMistakeLog" ADD CONSTRAINT "UserMistakeLog_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeaknessSnapshot" ADD CONSTRAINT "UserWeaknessSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
