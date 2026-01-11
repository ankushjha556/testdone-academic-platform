'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BookOpen, Calendar, Clock, BarChart2, Loader2, Trophy, Target } from 'lucide-react';

interface TestAttempt {
    id: string;
    totalScore: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    timeTaken: number;
    completedAt: string;
    test: {
        name: string;
        slug: string;
        totalMarks: number;
        totalQuestions: number;
        exam: { name: string; slug: string };
    };
}

export default function MyTestsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadAttempts();
        }
    }, [user, authLoading]);

    const loadAttempts = async () => {
        try {
            const res = await api.get<{ attempts: TestAttempt[] }>('/users/attempts?limit=50');
            if (res.success && res.data?.attempts) {
                setAttempts(res.data.attempts);
            }
        } catch (error) {
            console.error('Failed to load attempts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-gray-950 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading your tests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Tests</h1>
                    <p className="text-gray-600 dark:text-gray-400">View your test history and performance.</p>
                </div>

                {attempts.length > 0 ? (
                    <div className="space-y-4">
                        {attempts.map((attempt, i) => (
                            <Link
                                key={attempt.id}
                                href={`/tests/results/${attempt.id}`}
                                className="card p-5 block hover:shadow-lg transition-all animate-slide-up"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-7 h-7 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{attempt.test.name}</h3>
                                            <p className="text-sm text-gray-500">{attempt.test.exam.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            <span className="font-bold text-primary-600">{attempt.totalScore}/{attempt.test.totalMarks}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Target className="w-4 h-4" />
                                            <span>{attempt.correctCount}/{attempt.test.totalQuestions} correct</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(attempt.timeTaken)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="card p-10 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Tests Attempted Yet</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            You haven't taken any mock tests yet. Start practicing today to improve your score!
                        </p>
                        <Link href="/tests" className="btn btn-primary">
                            Browse Mock Tests
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
