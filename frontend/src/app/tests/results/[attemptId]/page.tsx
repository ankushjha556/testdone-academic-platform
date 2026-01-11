'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Trophy,
    Target,
    Clock,
    TrendingUp,
    CheckCircle2,
    XCircle,
    MinusCircle,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Share2,
    Download,
    Loader2,
    BarChart2,
} from 'lucide-react';

interface Result {
    attemptId: string;
    test: {
        id: string;
        name: string;
        slug: string;
        totalMarks: number;
        exam: { name: string; slug: string };
    };
    score: number;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    timeTakenSeconds: number;
    percentage: number;
    allIndiaRank: number | null;
    percentile: number | null;
    topicAnalysis: { topic: string; correct: number; total: number; accuracy: number }[];
    answers: {
        questionId: string;
        questionText: string;
        options: { id: string; text: string }[];
        selectedOption: string | null;
        correctAnswer: string;
        isCorrect: boolean | null;
        solution: string | null;
        timeSpent: number | null;
    }[];
}

export default function TestResultPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const attemptId = params.attemptId as string;

    const [result, setResult] = useState<Result | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        loadResult();
    }, [attemptId, user]);

    const loadResult = async () => {
        try {
            const response = await api.get<Result>(`/tests/results/${attemptId}`);
            if (response.success && response.data) {
                setResult(response.data);
            }
        } catch (error) {
            console.error('Failed to load result:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Result Not Found</h1>
                    <Link href="/dashboard" className="text-primary-600 hover:underline">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const filteredAnswers = result.answers.filter(a => {
        if (filter === 'correct') return a.isCorrect === true;
        if (filter === 'incorrect') return a.isCorrect === false;
        if (filter === 'unattempted') return a.selectedOption === null;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{result.test.name}</h1>
                        <p className="text-sm text-gray-500">{result.test.exam.name}</p>
                    </div>
                </div>

                {/* Score Card */}
                <div className="card p-6 mb-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Main Score */}
                        <div className="text-center sm:border-r border-gray-200 dark:border-gray-700">
                            <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-primary-500 flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary-600">{result.percentage.toFixed(0)}%</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.score}/{result.maxScore}
                            </p>
                            <p className="text-sm text-gray-500">Total Score</p>
                        </div>

                        {/* Stats */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{result.correctCount}</p>
                                    <p className="text-sm text-gray-500">Correct</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{result.incorrectCount}</p>
                                    <p className="text-sm text-gray-500">Incorrect</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <MinusCircle className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{result.unattemptedCount}</p>
                                    <p className="text-sm text-gray-500">Skipped</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{formatTime(result.timeTakenSeconds)}</p>
                                    <p className="text-sm text-gray-500">Time Taken</p>
                                </div>
                            </div>
                        </div>

                        {/* Rank */}
                        {result.allIndiaRank && (
                            <div className="text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                                <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">#{result.allIndiaRank}</p>
                                <p className="text-sm text-gray-500">All-India Rank</p>
                                {result.percentile && (
                                    <p className="text-xs text-amber-600 mt-1">Top {(100 - result.percentile).toFixed(1)}%</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Topic Analysis */}
                {result.topicAnalysis.length > 0 && (
                    <div className="card p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5" />
                            Topic-wise Analysis
                        </h2>
                        <div className="space-y-4">
                            {result.topicAnalysis.map((topic) => (
                                <div key={topic.topic}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic.topic}</span>
                                        <span className="text-sm text-gray-500">
                                            {topic.correct}/{topic.total} ({topic.accuracy.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${topic.accuracy >= 70 ? 'bg-green-500' :
                                                    topic.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${topic.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Questions Review */}
                <div className="card">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Question Review
                        </h2>
                        <div className="flex gap-2">
                            {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAnswers.map((answer, idx) => (
                            <div key={answer.questionId} className="p-4">
                                <button
                                    onClick={() => setExpandedQuestion(
                                        expandedQuestion === answer.questionId ? null : answer.questionId
                                    )}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answer.isCorrect === true ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                answer.isCorrect === false ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p
                                                className="text-gray-900 dark:text-white"
                                                dangerouslySetInnerHTML={{ __html: answer.questionText.substring(0, 150) + '...' }}
                                            />
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className={`${answer.isCorrect === true ? 'text-green-600' :
                                                        answer.isCorrect === false ? 'text-red-600' : 'text-gray-500'
                                                    }`}>
                                                    {answer.isCorrect === true ? '✓ Correct' :
                                                        answer.isCorrect === false ? '✗ Incorrect' : '○ Skipped'}
                                                </span>
                                                {answer.selectedOption && (
                                                    <span className="text-gray-500">Your answer: {answer.selectedOption}</span>
                                                )}
                                                <span className="text-gray-500">Correct: {answer.correctAnswer}</span>
                                            </div>
                                        </div>
                                        {expandedQuestion === answer.questionId ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedQuestion === answer.questionId && (
                                    <div className="mt-4 ml-12 space-y-4">
                                        {/* Full Question */}
                                        <div
                                            className="text-gray-800 dark:text-gray-200"
                                            dangerouslySetInnerHTML={{ __html: answer.questionText }}
                                        />

                                        {/* Options */}
                                        <div className="space-y-2">
                                            {answer.options.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-3 rounded-lg border ${opt.id === answer.correctAnswer
                                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                            : opt.id === answer.selectedOption
                                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                                : 'border-gray-200 dark:border-gray-700'
                                                        }`}
                                                >
                                                    <span className="font-medium">{opt.id}.</span> {opt.text}
                                                    {opt.id === answer.correctAnswer && (
                                                        <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Solution */}
                                        {answer.solution && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Solution:</p>
                                                <div
                                                    className="text-blue-700 dark:text-blue-200"
                                                    dangerouslySetInnerHTML={{ __html: answer.solution }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                    <Link
                        href={`/tests/${result.test.slug}`}
                        className="btn btn-primary"
                    >
                        Reattempt Test
                    </Link>
                    <Link href="/tests" className="btn btn-secondary">
                        Browse More Tests
                    </Link>
                </div>
            </div>
        </div>
    );
}
