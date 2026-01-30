/**
 * Mistake Classifier - Rule-Based Error Classification Engine
 * 
 * This module provides deterministic, transparent classification of user mistakes.
 * NO AI/ML - all rules are human-readable and auditable.
 * 
 * Classification Types:
 * - CONCEPTUAL_ERROR: Fundamental misunderstanding (easy question wrong)
 * - CALCULATION_ERROR: Computational mistake (medium difficulty, decent time)
 * - GUESSING_ERROR: Random answer without thinking (quick answer on hard question)
 * - TIME_PRESSURE_ERROR: Too rushed or too slow
 * - REPEATED_ERROR: Same question wrong multiple times
 */

import { Difficulty, MistakeType } from '@prisma/client';
import prisma from './prisma';

interface AnswerData {
    questionId: string;
    selectedOption: string | null;
    correctOption: string;
    timeSpentSeconds: number | null;
    isCorrect: boolean;
}

interface QuestionData {
    id: string;
    difficulty: Difficulty;
    subjectId: string;
    topicId: string | null;
}

// Time thresholds in seconds
const TIME_THRESHOLDS = {
    TOO_FAST: 5,           // Less than 5 seconds = likely guessing
    VERY_FAST: 10,         // Less than 10 seconds = quick answer
    NORMAL_MIN: 15,        // Normal minimum thinking time
    NORMAL_MAX: 60,        // Normal maximum thinking time
    TOO_SLOW: 90,          // More than 90 seconds = time pressure
};

/**
 * Classify a mistake based on answer and question data
 * Returns null for correct answers
 */
export async function classifyMistake(
    userId: string,
    answer: AnswerData,
    question: QuestionData
): Promise<MistakeType | null> {
    // Don't classify correct answers
    if (answer.isCorrect) {
        return null;
    }

    // Don't classify unattempted questions
    if (!answer.selectedOption) {
        return null;
    }

    // 1. REPEATED_ERROR: Check if user has wrong this question before
    const previousMistakes = await prisma.userMistakeLog.findMany({
        where: {
            userId,
            questionId: question.id,
            isCorrect: false,
        },
        take: 1,
    });

    if (previousMistakes.length > 0) {
        return MistakeType.REPEATED_ERROR;
    }

    // 2. TIME_PRESSURE_ERROR: Too fast or too slow
    if (answer.timeSpentSeconds !== null) {
        if (answer.timeSpentSeconds < TIME_THRESHOLDS.TOO_FAST) {
            // Less than 5 seconds is almost certainly not enough time to read and think
            return MistakeType.TIME_PRESSURE_ERROR;
        }
        if (answer.timeSpentSeconds > TIME_THRESHOLDS.TOO_SLOW) {
            // More than 90 seconds suggests struggling under time pressure
            return MistakeType.TIME_PRESSURE_ERROR;
        }
    }

    // 3. CONCEPTUAL_ERROR: Easy question wrong (fundamental misunderstanding)
    if (question.difficulty === Difficulty.EASY) {
        return MistakeType.CONCEPTUAL_ERROR;
    }

    // 4. GUESSING_ERROR: Hard question with very fast answer
    if (question.difficulty === Difficulty.HARD) {
        if (answer.timeSpentSeconds !== null && answer.timeSpentSeconds < TIME_THRESHOLDS.VERY_FAST) {
            return MistakeType.GUESSING_ERROR;
        }
    }

    // 5. Default: CALCULATION_ERROR for medium difficulty or unclassified
    return MistakeType.CALCULATION_ERROR;
}

/**
 * Classify multiple answers in batch
 * More efficient than individual queries
 */
export async function classifyMistakesBatch(
    userId: string,
    answers: AnswerData[],
    questions: Map<string, QuestionData>
): Promise<Map<string, MistakeType | null>> {
    const results = new Map<string, MistakeType | null>();

    // Get all previous mistakes for this user for these questions
    const questionIds = answers.map(a => a.questionId);
    const previousMistakes = await prisma.userMistakeLog.findMany({
        where: {
            userId,
            questionId: { in: questionIds },
            isCorrect: false,
        },
        select: {
            questionId: true,
        },
    });

    const previouslyWrong = new Set(previousMistakes.map(m => m.questionId));

    for (const answer of answers) {
        const question = questions.get(answer.questionId);
        if (!question) {
            results.set(answer.questionId, null);
            continue;
        }

        // Skip correct answers
        if (answer.isCorrect) {
            results.set(answer.questionId, null);
            continue;
        }

        // Skip unattempted
        if (!answer.selectedOption) {
            results.set(answer.questionId, null);
            continue;
        }

        let mistakeType: MistakeType;

        // 1. REPEATED_ERROR
        if (previouslyWrong.has(answer.questionId)) {
            mistakeType = MistakeType.REPEATED_ERROR;
        }
        // 2. TIME_PRESSURE_ERROR
        else if (answer.timeSpentSeconds !== null) {
            if (answer.timeSpentSeconds < TIME_THRESHOLDS.TOO_FAST ||
                answer.timeSpentSeconds > TIME_THRESHOLDS.TOO_SLOW) {
                mistakeType = MistakeType.TIME_PRESSURE_ERROR;
            }
            // 3. CONCEPTUAL_ERROR
            else if (question.difficulty === Difficulty.EASY) {
                mistakeType = MistakeType.CONCEPTUAL_ERROR;
            }
            // 4. GUESSING_ERROR
            else if (question.difficulty === Difficulty.HARD &&
                answer.timeSpentSeconds < TIME_THRESHOLDS.VERY_FAST) {
                mistakeType = MistakeType.GUESSING_ERROR;
            }
            // 5. Default
            else {
                mistakeType = MistakeType.CALCULATION_ERROR;
            }
        }
        // No time data - classify by difficulty
        else if (question.difficulty === Difficulty.EASY) {
            mistakeType = MistakeType.CONCEPTUAL_ERROR;
        }
        else {
            mistakeType = MistakeType.CALCULATION_ERROR;
        }

        results.set(answer.questionId, mistakeType);
    }

    return results;
}

/**
 * Get human-readable explanation for a mistake type
 */
export function getMistakeExplanation(type: MistakeType): string {
    switch (type) {
        case MistakeType.CONCEPTUAL_ERROR:
            return 'This indicates a fundamental gap in understanding. Review the core concept.';
        case MistakeType.CALCULATION_ERROR:
            return 'A computational or procedural mistake. Practice similar problems for accuracy.';
        case MistakeType.GUESSING_ERROR:
            return 'This appears to be a guess. Take time to work through the problem.';
        case MistakeType.TIME_PRESSURE_ERROR:
            return 'Time management affected this answer. Practice under timed conditions.';
        case MistakeType.REPEATED_ERROR:
            return 'You\'ve made this mistake before. Focus on understanding the underlying concept.';
        default:
            return 'Review this question to understand where you went wrong.';
    }
}

/**
 * Get short label for mistake type (for UI badges)
 */
export function getMistakeLabel(type: MistakeType): string {
    switch (type) {
        case MistakeType.CONCEPTUAL_ERROR:
            return 'Concept Gap';
        case MistakeType.CALCULATION_ERROR:
            return 'Calculation';
        case MistakeType.GUESSING_ERROR:
            return 'Guessed';
        case MistakeType.TIME_PRESSURE_ERROR:
            return 'Time Pressure';
        case MistakeType.REPEATED_ERROR:
            return 'Repeated';
        default:
            return 'Unknown';
    }
}
