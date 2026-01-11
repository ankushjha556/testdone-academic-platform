import { z } from 'zod';

export const createQuestionSchema = z.object({
    questionText: z.string().min(5),
    questionType: z.enum(['MCQ_SINGLE', 'MCQ_MULTIPLE', 'FILL_BLANK', 'TRUE_FALSE']),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean().optional()
    })).min(2),
    correctAnswer: z.string().optional(),
    solution: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    subjectId: z.string().uuid(),
    topicId: z.string().uuid().optional().nullable(),
    sectionId: z.string().uuid().optional().nullable(),
    // Strict: reject unknown keys is too harsh for some frameworks, but we can strip them.
    // We explicitly DO NOT include 'marks' here.
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const createTestSchema = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().optional(),
    testType: z.enum(['FULL_LENGTH', 'SECTIONAL', 'TOPIC', 'PREVIOUS_YEAR', 'CHAPTER']),
    totalQuestions: z.preprocess((val) => Number(val), z.number().int().min(1)),
    totalMarks: z.preprocess((val) => Number(val), z.number().min(1)),
    durationMinutes: z.preprocess((val) => Number(val), z.number().int().min(1)),
    passingPercent: z.preprocess((val) => Number(val), z.number().int().min(1).max(100)),
    examId: z.string().uuid(),
    questions: z.array(z.object({
        questionId: z.string().uuid(),
        sectionIndex: z.number().optional(),
        marks: z.preprocess((val) => Number(val), z.number().optional())
    })).optional().default([])
});

export const updateTestSchema = createTestSchema.partial();
