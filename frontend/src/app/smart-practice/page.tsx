'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
    Target,
    RefreshCw,
    TrendingUp,
    Zap,
    ChevronRight,
    Lock,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Sparkles,
} from 'lucide-react';

interface PracticeMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    available: boolean;
    suggestedSubject: string | null;
}

interface Question {
    id: string;
    questionText: string;
    options: { id: string; text: string }[];
    difficulty: string;
    subject: string;
    topic: string | null;
}

export default function SmartPracticePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [modes, setModes] = useState<PracticeMode[]>([]);
    const [suggestedAction, setSuggestedAction] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPremiumRequired, setIsPremiumRequired] = useState(false);

    // Practice session state
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [solution, setSolution] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadModes();
        }
    }, [user, authLoading]);

    const loadModes = async () => {
        try {
            const res = await api.get<{ modes: PracticeMode[]; suggestedAction: string | null }>('/smart-practice/modes');
            if (res.success && res.data) {
                setModes(res.data.modes);
                setSuggestedAction(res.data.suggestedAction);
            }
            if (!res.success && res.error?.message.includes('Premium')) {
                setIsPremiumRequired(true);
            }
        } catch (error) {
            console.error('Failed to load modes:', error);
            setError('Failed to load practice modes');
        } finally {
            setIsLoading(false);
        }
    };

    const startPractice = async (modeId: string) => {
        setIsLoading(true);
        setSelectedMode(modeId);

        try {
            const res = await api.get<{ questions: Question[] }>(`/smart-practice/questions?mode=${modeId}&limit=10`);
            if (res.success && res.data) {
                if (res.data.questions.length === 0) {
                    // No questions available - show feedback and reset
                    toast.error('No questions available for this mode. Complete more tests to unlock personalized practice.');
                    setSelectedMode(null);
                    setQuestions([]);
                } else {
                    setQuestions(res.data.questions);
                    setCurrentIndex(0);
                    setSessionStats({ correct: 0, total: 0 });
                }
            }
            if (!res.success && res.error?.message.includes('Premium')) {
                setIsPremiumRequired(true);
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
            setError('Failed to load questions');
            setSelectedMode(null);
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!selectedAnswer) return;

        const question = questions[currentIndex];

        try {
            const res = await api.post<{
                isCorrect: boolean;
                correctAnswer: string;
                solution: string | null;
            }>('/smart-practice/submit', {
                questionId: question.id,
                selectedOption: selectedAnswer,
                timeSpentSeconds: 30, // TODO: Add actual time tracking
            });

            if (res.success && res.data) {
                setIsCorrect(res.data.isCorrect);
                setCorrectAnswer(res.data.correctAnswer);
                setSolution(res.data.solution);
                setShowResult(true);
                setSessionStats(prev => ({
                    correct: prev.correct + (res.data!.isCorrect ? 1 : 0),
                    total: prev.total + 1,
                }));
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setSolution(null);
            setCorrectAnswer(null);
        } else {
            // Session complete
            setSelectedMode(null);
            setQuestions([]);
        }
    };

    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'target': return Target;
            case 'refresh': return RefreshCw;
            case 'trending-up': return TrendingUp;
            case 'zap': return Zap;
            default: return Target;
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading Smart Practice...</p>
                </div>
            </div>
        );
    }

    if (isPremiumRequired) {
        return (
            <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
                <div className="max-w-lg mx-auto px-4 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Unlock Smart Practice
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Get personalized practice sessions tailored to your weak areas.
                        Focus on what matters most for your preparation.
                    </p>
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Premium
                    </Link>
                </div>
            </div>
        );
    }

    // Practice session in progress
    if (selectedMode && questions.length > 0) {
        const question = questions[currentIndex];
        const progress = ((currentIndex + 1) / questions.length) * 100;

        return (
            <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Progress header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => {
                                    setSelectedMode(null);
                                    setQuestions([]);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Exit Practice
                            </button>
                            <div className="text-sm text-gray-500">
                                Question {currentIndex + 1} of {questions.length}
                            </div>
                            <div className="text-sm font-medium text-primary-600">
                                {sessionStats.correct}/{sessionStats.total} correct
                            </div>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question card */}
                    <div className="card p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-medium rounded">
                                {question.subject}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${question.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                question.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                    'bg-red-100 text-red-600 dark:bg-red-900/30'
                                }`}>
                                {question.difficulty}
                            </span>
                        </div>

                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6"
                            dangerouslySetInnerHTML={{ __html: question.questionText }}
                        />

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {question.options.map((option) => {
                                const isSelected = selectedAnswer === option.id;
                                const isCorrectOption = showResult && option.id === correctAnswer;
                                const isWrongSelection = showResult && isSelected && !isCorrect;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => !showResult && setSelectedAnswer(option.id)}
                                        disabled={showResult}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isCorrectOption
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                            : isWrongSelection
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : isSelected
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${isCorrectOption
                                                ? 'bg-emerald-500 text-white'
                                                : isWrongSelection
                                                    ? 'bg-red-500 text-white'
                                                    : isSelected
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {option.id}
                                            </span>
                                            <span className="text-gray-900 dark:text-white"
                                                dangerouslySetInnerHTML={{ __html: option.text }}
                                            />
                                            {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                                            {isWrongSelection && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result & solution */}
                        {showResult && solution && (
                            <div className={`p-4 rounded-xl mb-6 ${isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                }`}>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {isCorrect ? '✅ Correct!' : '📖 Solution'}
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: solution }}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end">
                            {!showResult ? (
                                <button
                                    onClick={submitAnswer}
                                    disabled={!selectedAnswer}
                                    className="btn btn-primary disabled:opacity-50"
                                >
                                    Check Answer
                                </button>
                            ) : (
                                <button
                                    onClick={nextQuestion}
                                    className="btn btn-primary"
                                >
                                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Session complete - show summary
    if (selectedMode && questions.length === 0 && sessionStats.total > 0) {
        const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
        const performanceMessage = accuracy >= 80 ? "Excellent work! You're mastering this." :
            accuracy >= 60 ? "Good progress! Keep practicing." :
                accuracy >= 40 ? "You're building momentum. Keep going!" :
                    "Every attempt helps you improve. Don't give up!";

        return (
            <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
                <div className="max-w-md mx-auto px-4">
                    <div className="card p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Session Complete
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {performanceMessage}
                        </p>

                        {/* Score Display */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
                            <div className="text-4xl font-bold text-primary-600 mb-1">
                                {sessionStats.correct}/{sessionStats.total}
                            </div>
                            <div className="text-sm text-gray-500">
                                {accuracy}% accuracy
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setSelectedMode(null);
                                    setSessionStats({ correct: 0, total: 0 });
                                }}
                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Practice Again
                            </button>
                            <Link href="/dashboard" className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Mode selection screen
    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Smart Practice
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Focus on your weak areas with personalized practice sessions
                    </p>
                </div>

                {/* Suggested action */}
                {suggestedAction && (
                    <div className="card p-5 mb-6 border-l-4 border-l-primary-500">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                                <Target className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                    Recommended for you
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {suggestedAction}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Practice modes */}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Choose a Practice Mode
                </h2>
                <div className="space-y-3">
                    {modes.map((mode) => {
                        const Icon = getIconComponent(mode.icon);
                        return (
                            <button
                                key={mode.id}
                                onClick={() => mode.available && startPractice(mode.id)}
                                disabled={!mode.available}
                                className={`w-full card p-5 text-left transition-all ${mode.available
                                    ? 'hover:border-primary-400 hover:shadow-md cursor-pointer'
                                    : 'opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${mode.available ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <Icon className={`w-5 h-5 ${mode.available ? 'text-primary-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-0.5">
                                            {mode.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                            {mode.description}
                                        </p>
                                        {!mode.available && (
                                            <p className="text-xs text-gray-400 mt-1">Complete a test to unlock</p>
                                        )}
                                        {mode.available && mode.suggestedSubject && (
                                            <p className="text-xs text-primary-600 mt-1">
                                                Focus: {mode.suggestedSubject}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${mode.available ? 'text-gray-400' : 'text-gray-300'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Empty state guidance */}
                {modes.length > 0 && modes.every(m => !m.available) && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            You haven't taken any tests yet.
                        </p>
                        <Link href="/tests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            Take a practice test to get started →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
