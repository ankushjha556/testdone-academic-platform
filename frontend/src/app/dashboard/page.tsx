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
                api.get<{ summary: DashboardStats }>('/analytics'),
                api.get<{ attempts: RecentAttempt[] }>('/users/attempts?limit=5'),
            ]);

            if (analyticsRes.success) {
                setStats(analyticsRes.data?.summary || null);
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
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Questions Solved',
            value: stats?.questionsAttempted || 0,
            icon: Target,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600',
            trend: '+8%',
            trendUp: true
        },
        {
            label: 'Average Score',
            value: `${stats?.averageScore?.toFixed(1) || 0}%`,
            icon: Trophy,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            iconColor: 'text-amber-600',
            trend: '+5%',
            trendUp: true
        },
        {
            label: 'Accuracy Rate',
            value: `${stats?.accuracy?.toFixed(1) || 0}%`,
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600',
            trend: '-2%',
            trendUp: false
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
                                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {stat.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {stat.value.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Chart & Quick Actions */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Performance Overview */}
                    <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-primary-600" />
                                Performance Overview
                            </h2>
                            <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>All time</option>
                            </select>
                        </div>

                        {/* Visual Bar Chart Representation */}
                        <div className="space-y-4">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                                const height = Math.random() * 60 + 20;
                                return (
                                    <div key={day} className="flex items-center gap-4">
                                        <span className="w-10 text-sm text-gray-500 dark:text-gray-400">{day}</span>
                                        <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg transition-all duration-500"
                                                style={{ width: `${height}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                                            {Math.round(height)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
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
