'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    options: { id: string; text: string }[];
    sectionIndex: number;
    questionOrder: number;
    marks: number;
}

interface TestAttempt {
    attemptId: string;
    testId: string;
    questions: Question[];
    sections: any[];
    startedAt: string;
    expiresAt: string;
    savedAnswers: Record<string, string | null>;
}

export default function TestAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const testId = params.testId as string;

    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | null>>({});
    const [markedReview, setMarkedReview] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        startTest();
    }, [testId, user]);

    // Timer
    useEffect(() => {
        if (!attempt) return;

        const expiresAt = new Date(attempt.expiresAt).getTime();

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                handleSubmit(true);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [attempt]);

    const startTest = async () => {
        try {
            let targetId = testId;
            // distinct UUID regex
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (!uuidRegex.test(testId)) {
                // It's a slug, resolve it
                const detailsRes = await api.get(`/tests/${testId}`);
                if (detailsRes.success && (detailsRes.data as any)?.id) {
                    targetId = (detailsRes.data as any).id;
                } else {
                    throw new Error('Test not found');
                }
            }

            const response = await api.post<TestAttempt>(`/tests/${targetId}/start`);
            if (response.success && response.data) {
                setAttempt(response.data);
                setAnswers(response.data.savedAnswers || {});

                // Calculate initial time
                const expiresAt = new Date(response.data.expiresAt).getTime();
                const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
                setTimeRemaining(remaining);
            } else {
                toast.error('Failed to start test');
                router.push('/tests');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to start test');
            router.push('/tests');
        } finally {
            setIsLoading(false);
        }
    };

    const saveAnswer = async (questionId: string, selectedOption: string | null) => {
        if (!attempt) return;

        setAnswers(prev => ({ ...prev, [questionId]: selectedOption }));

        try {
            await api.post(`/tests/attempts/${attempt.attemptId}/answer`, {
                questionId,
                selectedOption,
                isMarkedReview: markedReview.has(questionId),
            });
        } catch (error) {
            console.error('Failed to save answer');
        }
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!attempt || isSubmitting) return;

        if (!autoSubmit && !showSubmitModal) {
            setShowSubmitModal(true);
            return;
        }

        setIsSubmitting(true);
        setShowSubmitModal(false);

        try {
            const response = await api.post(`/tests/attempts/${attempt.attemptId}/submit`);
            if (response.success) {
                toast.success(autoSubmit ? 'Time up! Test submitted' : 'Test submitted successfully');
                router.push(`/tests/results/${attempt.attemptId}`);
            } else {
                toast.error('Failed to submit test');
            }
        } catch (error) {
            toast.error('Failed to submit test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMarkReview = (questionId: string) => {
        setMarkedReview(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!attempt) {
        return null;
    }

    const question = attempt.questions[currentQuestion];
    const answeredCount = Object.values(answers).filter(Boolean).length;
    const unattemptedCount = attempt.questions.length - answeredCount;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                        Mock Test
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeRemaining < 300 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            timeRemaining < 600 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeRemaining)}
                        </div>

                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="btn btn-primary"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Main Question Area */}
                <div className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto">
                        {/* Question Number */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Question {currentQuestion + 1} of {attempt.questions.length}
                            </span>
                            <button
                                onClick={() => toggleMarkReview(question.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${markedReview.has(question.id)
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                            >
                                <Flag className="w-4 h-4" />
                                {markedReview.has(question.id) ? 'Marked' : 'Mark for Review'}
                            </button>
                        </div>

                        {/* Question Card */}
                        <div className="card p-6 mb-6">
                            <div
                                className="text-lg text-gray-900 dark:text-white mb-6 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: question.questionText }}
                            />

                            {/* Options */}
                            <div className="space-y-3">
                                {question.options.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => saveAnswer(question.id, option.id)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[question.id] === option.id
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answers[question.id] === option.id
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {option.id}
                                            </span>
                                            <span className="flex-1 text-gray-800 dark:text-gray-200">{option.text}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Clear Response */}
                            {answers[question.id] && (
                                <button
                                    onClick={() => saveAnswer(question.id, null)}
                                    className="mt-4 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    Clear Response
                                </button>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                                className="btn btn-secondary"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            <button
                                onClick={() => setCurrentQuestion(Math.min(attempt.questions.length - 1, currentQuestion + 1))}
                                disabled={currentQuestion === attempt.questions.length - 1}
                                className="btn btn-secondary"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question Palette */}
                <aside className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 hidden lg:block">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Question Palette</h3>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700" />
                            <span className="text-gray-600 dark:text-gray-400">Not Visited</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500" />
                            <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-500" />
                            <span className="text-gray-600 dark:text-gray-400">Marked</span>
                        </div>
                    </div>

                    {/* Questions Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {attempt.questions.map((q, idx) => {
                            const isAnswered = !!answers[q.id];
                            const isMarked = markedReview.has(q.id);
                            const isCurrent = idx === currentQuestion;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${isCurrent ? 'ring-2 ring-primary-500' : ''
                                        } ${isMarked ? 'bg-amber-500 text-white' :
                                            isAnswered ? 'bg-green-500 text-white' :
                                                idx <= currentQuestion ? 'bg-red-500 text-white' :
                                                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Answered</span>
                            <span className="font-medium text-green-600">{answeredCount}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
                            <span className="font-medium text-red-600">{unattemptedCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Marked</span>
                            <span className="font-medium text-amber-600">{markedReview.size}</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Test?</h2>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Are you sure you want to submit? You have:
                        </p>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between">
                                <span>Answered:</span>
                                <span className="font-medium text-green-600">{answeredCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Unattempted:</span>
                                <span className="font-medium text-red-600">{unattemptedCount}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Review Again
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                className="btn btn-primary flex-1"
                            >
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
