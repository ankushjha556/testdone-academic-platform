'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
    BookOpen,
    Clock,
    Target,
    TrendingUp,
    Award,
    ChevronRight,
    BarChart2,
    CheckCircle2,
    XCircle,
    Loader2,
    Calendar,
    Zap,
    Trophy,
    Flame,
    ArrowUp,
    ArrowDown,
    Sparkles,
} from 'lucide-react';

interface DashboardStats {
    testsAttempted: number;
    questionsAttempted: number;
    averageScore: number;
    accuracy: number;
}

interface SubjectWeakness {
    subjectId: string;
    name: string;
    accuracy: number;
    trend: 'improving' | 'declining' | 'stable';
    errorCount: number;
}

interface AnalyticsData {
    summary: DashboardStats & { improvementDelta: number | null; thisWeekTests: number };
    subjectBreakdown: SubjectWeakness[];
    weakTopics: any[];
    strongTopics: any[];
    suggestedAction: string | null;
}

interface RecentAttempt {
    id: string;
    totalScore: number;
    correctCount: number;
    completedAt: string;
    test: {
        name: string;
        slug: string;
        totalMarks: number;
        exam: { name: string };
    };
}

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
    const [weakAreas, setWeakAreas] = useState<SubjectWeakness[]>([]);
    const [strongAreas, setStrongAreas] = useState<any[]>([]);
    const [suggestedAction, setSuggestedAction] = useState<string | null>(null);
    const [improvementDelta, setImprovementDelta] = useState<number | null>(null);
    const [thisWeekTests, setThisWeekTests] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadDashboardData();
        }
    }, [user, authLoading]);

    const loadDashboardData = async () => {
        try {
            const [analyticsRes, attemptsRes] = await Promise.all([
                api.get<AnalyticsData>('/analytics'),
                api.get<{ attempts: RecentAttempt[] }>('/users/attempts?limit=5'),
            ]);

            if (analyticsRes.success && analyticsRes.data) {
                setStats(analyticsRes.data.summary || null);
                setWeakAreas(analyticsRes.data.subjectBreakdown || []);
                setStrongAreas(analyticsRes.data.strongTopics || []);
                setSuggestedAction(analyticsRes.data.suggestedAction || null);
                setImprovementDelta(analyticsRes.data.summary?.improvementDelta ?? null);
                setThisWeekTests(analyticsRes.data.summary?.thisWeekTests || 0);
            }
            if (attemptsRes.success) {
                setRecentAttempts(attemptsRes.data?.attempts || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Alias for icon
    const ClipboardCheck = BookOpen;

    const statCards = [
        {
            label: 'Tests Completed',
            value: stats?.testsAttempted || 0,
            icon: ClipboardCheck,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600',
            subtext: thisWeekTests > 0 ? `${thisWeekTests} this week` : null,
        },
        {
            label: 'Questions Solved',
            value: stats?.questionsAttempted || 0,
            icon: Target,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600',
            subtext: null,
        },
        {
            label: 'Average Score',
            value: `${stats?.averageScore?.toFixed(1) || 0}%`,
            icon: Trophy,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            iconColor: 'text-amber-600',
            trend: improvementDelta,
        },
        {
            label: 'Accuracy Rate',
            value: `${stats?.accuracy?.toFixed(1) || 0}%`,
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600',
            subtext: null,
        },
    ];


    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Section with Gradient */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 animate-pulse-glow">
                            <span className="text-2xl font-bold text-white">{user?.firstName?.charAt(0)}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white">
                                Welcome back, {user?.firstName}!
                                <span className="inline-block ml-2 animate-float">👋</span>
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500" />
                                Keep the momentum going! You're doing great.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards with Glassmorphism */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={`card p-6 relative overflow-hidden group animate-slide-up stagger-${index + 1}`}
                            style={{ opacity: 0 }}
                        >
                            {/* Gradient Background Accent */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                                    </div>
                                    {stat.trend !== undefined && stat.trend !== null && (
                                        <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {stat.trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                {stat.subtext && (
                                    <p className="text-xs text-primary-600 mt-1">{stat.subtext}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mistake Intelligence Section */}
                {(suggestedAction || weakAreas.length > 0) && (
                    <div className="grid lg:grid-cols-2 gap-4 mb-8">
                        {/* Suggested Action Card */}
                        {suggestedAction && (
                            <div className="card p-5 border-l-4 border-l-primary-500 animate-slide-up" style={{ opacity: 0, animationDelay: '0.25s' }}>
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
                                        <Sparkles className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                                            Recommended Focus
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                                            {suggestedAction}
                                        </p>
                                        <Link
                                            href="/smart-practice"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Start Practice
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Weak Areas Card */}
                        {weakAreas.length > 0 && (
                            <div className="card p-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                    <Target className="w-4 h-4 text-orange-500" />
                                    Areas to Improve
                                </h3>
                                <div className="space-y-3">
                                    {weakAreas.slice(0, 3).map((area, i) => (
                                        <div key={area.subjectId} className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${area.accuracy < 40 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                area.accuracy < 60 ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                                    'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                }`}>
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{area.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${area.accuracy < 40 ? 'bg-red-500' :
                                                            area.accuracy < 60 ? 'bg-orange-500' :
                                                                'bg-yellow-500'
                                                            }`}
                                                        style={{ width: `${area.accuracy}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-medium w-8 text-right ${area.accuracy < 40 ? 'text-red-600' :
                                                    area.accuracy < 60 ? 'text-orange-600' :
                                                        'text-yellow-600'
                                                    }`}>
                                                    {area.accuracy}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong Areas Card */}
                        {strongAreas.length > 0 && (
                            <div className="card p-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.35s' }}>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Strong Areas
                                </h3>
                                <div className="space-y-3">
                                    {strongAreas.slice(0, 3).map((area, i) => (
                                        <div key={area.topicId || i} className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{area.name}</p>
                                                {area.subject && (
                                                    <p className="text-xs text-gray-500 truncate">{area.subject}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{ width: `${area.accuracy}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium w-8 text-right text-emerald-600">
                                                    {area.accuracy}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Performance Chart & Quick Actions */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Subject Performance Overview */}
                    <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-primary-600" />
                                Subject Performance
                            </h2>
                            {improvementDelta !== null && (
                                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${improvementDelta >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                    {improvementDelta >= 0 ? <TrendingUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                    {improvementDelta >= 0 ? '+' : ''}{improvementDelta}% vs last week
                                </div>
                            )}
                        </div>

                        {/* Subject Accuracy Bars */}
                        {weakAreas.length > 0 ? (
                            <div className="space-y-4">
                                {weakAreas.map((subject) => (
                                    <div key={subject.subjectId} className="flex items-center gap-4">
                                        <span className="w-24 text-sm text-gray-700 dark:text-gray-300 truncate">{subject.name}</span>
                                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            <div
                                                className={`h-full rounded-lg transition-all duration-500 ${subject.accuracy >= 70 ? 'bg-emerald-500' :
                                                    subject.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${subject.accuracy}%` }}
                                            />
                                        </div>
                                        <span className={`w-12 text-sm font-medium text-right ${subject.accuracy >= 70 ? 'text-emerald-600' :
                                            subject.accuracy >= 40 ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                            {subject.accuracy}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No performance data yet</p>
                                <Link href="/tests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    Take a test to see your performance →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="card p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.4s' }}>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <Link
                                href="/tests"
                                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-5 h-5" />
                                    <span className="font-medium">Start New Test</span>
                                </div>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/smart-practice"
                                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Smart Practice</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/exams"
                                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Browse Exams</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/dashboard/bookmarks"
                                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">My Bookmarks</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.5s' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Recent Test Attempts
                        </h2>
                        <Link href="/dashboard/tests" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentAttempts.length > 0 ? (
                        <div className="space-y-4">
                            {recentAttempts.map((attempt, i) => (
                                <Link
                                    key={attempt.id}
                                    href={`/tests/results/${attempt.id}`}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                {attempt.test.name}
                                            </p>
                                            <p className="text-sm text-gray-500">{attempt.test.exam.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-primary-600">
                                            {attempt.totalScore}/{attempt.test.totalMarks}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(attempt.completedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tests Attempted Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Start practicing to see your progress here.</p>
                            <Link href="/tests" className="btn btn-primary">
                                <Zap className="w-4 h-4" />
                                Take Your First Test
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
