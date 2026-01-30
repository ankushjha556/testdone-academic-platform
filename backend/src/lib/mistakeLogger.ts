/**
 * Mistake Logger Service
 * 
 * Handles logging of user mistakes to UserMistakeLog table.
 * This is an append-only log - data is NEVER deleted or modified.
 * 
 * Called after test submission to record all answers.
 */

import { Difficulty, MistakeType } from '@prisma/client';
import prisma from './prisma';
import { classifyMistakesBatch } from './mistakeClassifier';
import { isFeatureEnabled } from './featureFlags';

interface AttemptAnswerWithQuestion {
    questionId: string;
    selectedOption: string | null;
    isCorrect: boolean | null;
    timeSpentSeconds: number | null;
    question: {
        id: string;
        correctAnswer: string | null;
        difficulty: Difficulty;
        subjectId: string;
        topicId: string | null;
    };
}

interface TestAttemptData {
    id: string;
    userId: string;
    testId: string;
    test: {
        examId: string;
    };
}

/**
 * Log all answers from a completed test attempt to UserMistakeLog
 * Both correct and incorrect answers are logged for complete tracking.
 * 
 * @param attempt - The completed test attempt
 * @param answers - All answers with question data
 */
export async function logMistakesFromAttempt(
    attempt: TestAttemptData,
    answers: AttemptAnswerWithQuestion[]
): Promise<void> {
    // Check feature flag
    if (!isFeatureEnabled('mistakeIntelligence')) {
        console.log('[MistakeLogger] Feature disabled, skipping logging');
        return;
    }

    console.log(`[MistakeLogger] Logging ${answers.length} answers for attempt ${attempt.id}`);

    try {
        // Build question map for batch classification
        const questionMap = new Map<string, {
            id: string;
            difficulty: Difficulty;
            subjectId: string;
            topicId: string | null;
        }>();

        const answerData: Array<{
            questionId: string;
            selectedOption: string | null;
            correctOption: string;
            timeSpentSeconds: number | null;
            isCorrect: boolean;
        }> = [];

        for (const answer of answers) {
            const q = answer.question;
            questionMap.set(q.id, {
                id: q.id,
                difficulty: q.difficulty,
                subjectId: q.subjectId,
                topicId: q.topicId,
            });

            answerData.push({
                questionId: answer.questionId,
                selectedOption: answer.selectedOption,
                correctOption: q.correctAnswer || '',
                timeSpentSeconds: answer.timeSpentSeconds,
                isCorrect: answer.isCorrect === true,
            });
        }

        // Batch classify all mistakes
        const classifications = await classifyMistakesBatch(
            attempt.userId,
            answerData,
            questionMap
        );

        // Prepare log entries
        const logEntries = answers.map(answer => {
            const q = answer.question;
            const mistakeType = classifications.get(answer.questionId) || null;

            return {
                userId: attempt.userId,
                questionId: answer.questionId,
                attemptId: attempt.id,
                examId: attempt.test.examId,
                subjectId: q.subjectId,
                topicId: q.topicId,
                difficulty: q.difficulty,
                isCorrect: answer.isCorrect === true,
                selectedOption: answer.selectedOption,
                correctOption: q.correctAnswer || '',
                mistakeType: answer.isCorrect === false ? mistakeType : null,
                timeSpentSeconds: answer.timeSpentSeconds,
            };
        });

        // Batch insert all logs
        await prisma.userMistakeLog.createMany({
            data: logEntries,
        });

        console.log(`[MistakeLogger] Successfully logged ${logEntries.length} entries`);

        // Count and log statistics
        const correct = logEntries.filter(e => e.isCorrect).length;
        const incorrect = logEntries.filter(e => !e.isCorrect).length;
        console.log(`[MistakeLogger] Stats: ${correct} correct, ${incorrect} incorrect`);

    } catch (error) {
        // Log error but don't fail the test submission
        console.error('[MistakeLogger] Failed to log mistakes:', error);
    }
}

/**
 * Log a single answer from Smart Practice mode
 * 
 * @param userId - The user ID
 * @param questionId - The question ID
 * @param selectedOption - User's selected option
 * @param isCorrect - Whether the answer is correct
 * @param timeSpentSeconds - Time spent on the question
 */
export async function logSmartPracticeAnswer(
    userId: string,
    question: {
        id: string;
        correctAnswer: string | null;
        difficulty: Difficulty;
        subjectId: string;
        topicId: string | null;
        examId?: string | null;
    },
    selectedOption: string | null,
    isCorrect: boolean,
    timeSpentSeconds: number | null
): Promise<void> {
    // Check feature flag
    if (!isFeatureEnabled('mistakeIntelligence')) {
        return;
    }

    try {
        // Classify mistake (only for incorrect answers)
        let mistakeType: MistakeType | null = null;
        if (!isCorrect && selectedOption) {
            const { classifyMistake } = await import('./mistakeClassifier');
            mistakeType = await classifyMistake(
                userId,
                {
                    questionId: question.id,
                    selectedOption,
                    correctOption: question.correctAnswer || '',
                    timeSpentSeconds,
                    isCorrect,
                },
                {
                    id: question.id,
                    difficulty: question.difficulty,
                    subjectId: question.subjectId,
                    topicId: question.topicId,
                }
            );
        }

        await prisma.userMistakeLog.create({
            data: {
                userId,
                questionId: question.id,
                attemptId: null, // No attempt for Smart Practice
                examId: question.examId || null,
                subjectId: question.subjectId,
                topicId: question.topicId,
                difficulty: question.difficulty,
                isCorrect,
                selectedOption,
                correctOption: question.correctAnswer || '',
                mistakeType,
                timeSpentSeconds,
            },
        });
    } catch (error) {
        console.error('[MistakeLogger] Failed to log smart practice answer:', error);
    }
}
