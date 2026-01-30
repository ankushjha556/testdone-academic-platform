-- CreateEnum
CREATE TYPE "MistakeSource" AS ENUM ('MOCK_TEST', 'SMART_PRACTICE', 'QUESTION_BANK');

-- AlterTable
ALTER TABLE "UserMistakeLog" ADD COLUMN     "sourceType" "MistakeSource" NOT NULL DEFAULT 'MOCK_TEST';
