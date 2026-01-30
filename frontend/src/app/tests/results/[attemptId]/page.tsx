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
    Loader2,
    BarChart2,
    Zap,
    Sparkles,
    Lightbulb,
    AlertCircle,
    TrendingDown,
    RefreshCw,
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
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{result.test.name}</h1>
                        <p className="text-sm text-gray-500">{result.test.exam.name}</p>
                    </div>
                </div>

                {/* Mentor Feedback Message */}
                <div className="card p-5 mb-6 border-l-4 border-l-primary-500">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">Test Performance Summary</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {result.percentage >= 80 ? (
                                    <>Excellent work! You scored <strong>{result.percentage.toFixed(0)}%</strong> — you're demonstrating strong command over the topics. Focus on speed and consistency for the real exam.</>
                                ) : result.percentage >= 60 ? (
                                    <>Good effort! You scored <strong>{result.percentage.toFixed(0)}%</strong>. Review the topics below to strengthen your weak areas and push closer to 80%+.</>
                                ) : result.percentage >= 40 ? (
                                    <>You scored <strong>{result.percentage.toFixed(0)}%</strong>. There's room for growth — focus on the weak areas identified below and practice consistently.</>
                                ) : (
                                    <>This test scored <strong>{result.percentage.toFixed(0)}%</strong>. Don't be discouraged — use the insights below to identify gaps and start focused practice.</>
                                )}
                            </p>
                        </div>
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
                    <div className="card p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-primary-600" />
                                Performance by Topic
                            </h2>
                        </div>

                        {/* Strong Areas */}
                        {result.topicAnalysis.some(t => t.accuracy >= 70) && (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Strong Areas
                                </p>
                                <div className="space-y-2">
                                    {result.topicAnalysis.filter(t => t.accuracy >= 70).map((topic) => (
                                        <div key={topic.topic} className="flex items-center gap-3">
                                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{topic.topic}</span>
                                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${topic.accuracy}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-emerald-600 w-10 text-right">{topic.accuracy.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Areas to Improve */}
                        {result.topicAnalysis.some(t => t.accuracy < 70) && (
                            <div>
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    Areas to Improve
                                </p>
                                <div className="space-y-2">
                                    {result.topicAnalysis.filter(t => t.accuracy < 70).map((topic) => (
                                        <div key={topic.topic} className="flex items-center gap-3">
                                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{topic.topic}</span>
                                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${topic.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${topic.accuracy}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium w-10 text-right ${topic.accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {topic.accuracy.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Practice CTA */}
                        {result.topicAnalysis.some(t => t.accuracy < 70) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
                                <Link
                                    href="/smart-practice"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                >
                                    <Zap className="w-4 h-4" />
                                    Practice Weak Areas
                                </Link>
                                <button
                                    onClick={() => setFilter('incorrect')}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Incorrect
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Key Takeaways */}
                <div className="card p-5 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Key Takeaways from This Test
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Accuracy */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.correctCount > result.incorrectCount ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                {result.correctCount > result.incorrectCount ? (
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-orange-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {((result.correctCount / (result.correctCount + result.incorrectCount)) * 100).toFixed(0)}% Accuracy
                                </p>
                                <p className="text-xs text-gray-500">
                                    {result.correctCount} correct of {result.correctCount + result.incorrectCount} attempted
                                </p>
                            </div>
                        </div>

                        {/* Unattempted */}
                        {result.unattemptedCount > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {result.unattemptedCount} Questions Skipped
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {result.unattemptedCount > 10 ? 'Consider time management' : 'Review skipped questions'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Time */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatTime(result.timeTakenSeconds)} Spent
                                </p>
                                <p className="text-xs text-gray-500">
                                    ~{Math.round(result.timeTakenSeconds / (result.correctCount + result.incorrectCount + result.unattemptedCount))}s per question
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Review */}
                <div className="card">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Review Questions
                        </h2>
                        <div className="flex gap-1.5">
                            {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Link
                        href={`/tests/${result.test.slug}`}
                        className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-center"
                    >
                        Reattempt Test
                    </Link>
                    <Link
                        href="/smart-practice"
                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Smart Practice
                    </Link>
                    <Link href="/tests" className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                        Browse Tests
                    </Link>
                </div>
            </div>
        </div>
    );
}
