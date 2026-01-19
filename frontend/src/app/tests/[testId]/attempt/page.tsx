'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
    BookOpen,
    Info,
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
    passage?: string; // For reading comprehension questions
}

interface Section {
    name: string;
    questionsCount: number;
}

interface TestAttempt {
    attemptId: string;
    testId: string;
    questions: Question[];
    sections: Section[];
    startedAt: string;
    expiresAt: string;
    serverTime: string;
    savedAnswers: Record<string, string | null>;
}

export default function TestAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const testId = params.testId as string;

    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | null>>({});
    const [markedReview, setMarkedReview] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [clockOffset, setClockOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Group questions by section
    const questionsBySection = useMemo(() => {
        if (!attempt) return [];
        const sections: Question[][] = [];
        attempt.questions.forEach(q => {
            if (!sections[q.sectionIndex]) {
                sections[q.sectionIndex] = [];
            }
            sections[q.sectionIndex].push(q);
        });
        // Sort each section by questionOrder
        sections.forEach(sec => sec.sort((a, b) => a.questionOrder - b.questionOrder));
        return sections;
    }, [attempt]);

    const currentSectionQuestions = questionsBySection[currentSection] || [];
    const currentQuestion = currentSectionQuestions[currentQuestionInSection];

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        startTest();
    }, [testId, user]);

    // Timer with Offset
    useEffect(() => {
        if (!attempt) return;

        const expiresAt = new Date(attempt.expiresAt).getTime();

        const timer = setInterval(() => {
            const now = Date.now();
            const serverNow = now - clockOffset;
            const remaining = Math.max(0, Math.floor((expiresAt - serverNow) / 1000));
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                handleSubmit(true);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [attempt, clockOffset]);

    const startTest = async () => {
        try {
            let targetId = testId;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (!uuidRegex.test(testId)) {
                const detailsRes = await api.get(`/tests/${testId}`);
                if (detailsRes.success && (detailsRes.data as any)?.id) {
                    targetId = (detailsRes.data as any).id;
                } else {
                    throw new Error('Test not found');
                }
            }

            const response = await api.post<TestAttempt>(`/tests/${targetId}/start`);
            if (response.success && response.data) {
                const data = response.data;

                let offset = 0;
                if (data.serverTime) {
                    const clientTime = Date.now();
                    const serverTime = new Date(data.serverTime).getTime();
                    offset = clientTime - serverTime;
                    setClockOffset(offset);
                }

                setAttempt(data);
                setAnswers(data.savedAnswers || {});

                const expiresAt = new Date(data.expiresAt).getTime();
                const now = Date.now();
                const serverNow = now - offset;
                const remaining = Math.max(0, Math.floor((expiresAt - serverNow) / 1000));
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
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Navigation within section
    const goToNextQuestion = () => {
        if (currentQuestionInSection < currentSectionQuestions.length - 1) {
            setCurrentQuestionInSection(prev => prev + 1);
        }
    };

    const goToPrevQuestion = () => {
        if (currentQuestionInSection > 0) {
            setCurrentQuestionInSection(prev => prev - 1);
        }
    };

    // Change section
    const changeSection = (sectionIndex: number) => {
        setCurrentSection(sectionIndex);
        setCurrentQuestionInSection(0);
    };

    // Calculate stats for current section
    const getSectionStats = (sectionIdx: number) => {
        const sectionQuestions = questionsBySection[sectionIdx] || [];
        const answered = sectionQuestions.filter(q => answers[q.id]).length;
        const marked = sectionQuestions.filter(q => markedReview.has(q.id)).length;
        return { answered, marked, total: sectionQuestions.length };
    };

    // Overall stats
    const answeredCount = Object.values(answers).filter(Boolean).length;
    const unattemptedCount = attempt ? attempt.questions.length - answeredCount : 0;

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

    const sections = attempt.sections || [];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
                <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                        SSC CGL Tier-II Mock Test
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
                            Submit Test
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-full mx-auto px-4">
                        <div className="flex overflow-x-auto gap-1 py-2">
                            {sections.map((section, idx) => {
                                const stats = getSectionStats(idx);
                                const isActive = idx === currentSection;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => changeSection(idx)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <span className="block">{section.name}</span>
                                        <span className={`text-xs ${isActive ? 'text-primary-100' : 'text-gray-500'}`}>
                                            {stats.answered}/{stats.total} answered
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Main Question Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        {/* Section Title & Question Number */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                    {sections[currentSection]?.name || `Section ${currentSection + 1}`}
                                </span>
                                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Question {currentQuestionInSection + 1} of {currentSectionQuestions.length}
                                </span>
                            </div>
                            {currentQuestion && (
                                <button
                                    onClick={() => toggleMarkReview(currentQuestion.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${markedReview.has(currentQuestion.id)
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}
                                >
                                    <Flag className="w-4 h-4" />
                                    {markedReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
                                </button>
                            )}
                        </div>

                        {!currentQuestion ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                                <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-full mb-4">
                                    <Info className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Questions Available</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                    This section does not contain any questions for this mock test. Please switch to another section to continue.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Passage (if exists) */}
                                {currentQuestion.passage && (
                                    <div className="card p-6 mb-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                                        <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300">
                                            <BookOpen className="w-5 h-5" />
                                            <span className="font-semibold">Reading Passage</span>
                                        </div>
                                        <div
                                            className="text-gray-800 dark:text-gray-200 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: currentQuestion.passage }}
                                        />
                                    </div>
                                )}

                                {/* Question Card */}
                                <div className="card p-6 mb-6">
                                    <div
                                        className="text-lg text-gray-900 dark:text-white mb-6 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                                    />

                                    {/* Options */}
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => saveAnswer(currentQuestion.id, option.id)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion.id] === option.id
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answers[currentQuestion.id] === option.id
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
                                    {answers[currentQuestion.id] && (
                                        <button
                                            onClick={() => saveAnswer(currentQuestion.id, null)}
                                            className="mt-4 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                        >
                                            Clear Response
                                        </button>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={goToPrevQuestion}
                                        disabled={currentQuestionInSection === 0}
                                        className="btn btn-secondary disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>

                                    <button
                                        onClick={goToNextQuestion}
                                        disabled={currentQuestionInSection === currentSectionQuestions.length - 1}
                                        className="btn btn-secondary disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Question Palette - Section-wise */}
                <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 hidden lg:block overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {sections[currentSection]?.name || `Section ${currentSection + 1}`}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Click on a question number to navigate
                    </p>

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

                    {/* Questions Grid - Only current section */}
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {currentSectionQuestions.map((q, idx) => {
                            const isAnswered = !!answers[q.id];
                            const isMarked = markedReview.has(q.id);
                            const isCurrent = idx === currentQuestionInSection;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionInSection(idx)}
                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                                        } ${isMarked ? 'bg-amber-500 text-white' :
                                            isAnswered ? 'bg-green-500 text-white' :
                                                idx <= currentQuestionInSection ? 'bg-red-500 text-white' :
                                                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Section Summary */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Section Progress</h4>
                        {sections.map((sec, idx) => {
                            const stats = getSectionStats(idx);
                            return (
                                <div key={idx} className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{sec.name}</span>
                                    <span className={`font-medium ${stats.answered === stats.total ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {stats.answered}/{stats.total}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Overall Summary */}
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-3">Overall Progress</h4>
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
                            Are you sure you want to submit? Review your progress:
                        </p>

                        <div className="space-y-2 mb-6">
                            {sections.map((sec, idx) => {
                                const stats = getSectionStats(idx);
                                return (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{sec.name}</span>
                                        <span className={`font-medium ${stats.answered === stats.total ? 'text-green-600' : 'text-amber-600'}`}>
                                            {stats.answered}/{stats.total}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="border-t pt-2 mt-2 flex justify-between">
                                <span className="font-medium">Total</span>
                                <span className="font-bold text-primary-600">{answeredCount}/{attempt.questions.length}</span>
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
