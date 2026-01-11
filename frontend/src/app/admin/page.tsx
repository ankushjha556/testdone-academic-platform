'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    BookOpen,
    FileText,
    HelpCircle,
    Users,
    TrendingUp,
    TrendingDown,
    Plus,
    Eye,
    Edit,
    ArrowRight,
    Activity,
    Clock,
} from 'lucide-react';

interface Stats {
    totalExams: number;
    totalTests: number;
    totalQuestions: number;
    totalUsers: number;
    publishedExams: number;
    publishedQuestions: number;
    recentActivity: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await api.get<{ stats: Stats }>('/admin/stats');
            if (res.success && res.data) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Exams',
            value: stats?.totalExams || 0,
            icon: BookOpen,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            link: '/admin/exams',
        },
        {
            label: 'Mock Tests',
            value: stats?.totalTests || 0,
            icon: FileText,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-500/10',
            link: '/admin/tests',
        },
        {
            label: 'Questions',
            value: stats?.totalQuestions || 0,
            icon: HelpCircle,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            link: '/admin/questions',
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10',
            link: '/admin/users',
        },
    ];

    const quickActions = [
        { label: 'Add New Exam', href: '/admin/exams/new', icon: BookOpen, color: 'bg-blue-600 hover:bg-blue-700' },
        { label: 'Add Question', href: '/admin/questions/new', icon: HelpCircle, color: 'bg-purple-600 hover:bg-purple-700' },
        { label: 'Create Mock Test', href: '/admin/tests/new', icon: FileText, color: 'bg-emerald-600 hover:bg-emerald-700' },
        { label: 'Upload Book/PDF', href: '/admin/books/new', icon: Plus, color: 'bg-amber-600 hover:bg-amber-700' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400">Welcome back! Here's an overview of your platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <Link
                        key={stat.label}
                        href={stat.link}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('emerald') ? '#10b981' : stat.color.includes('purple') ? '#a855f7' : '#f59e0b' }} />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className={`flex items-center gap-3 px-4 py-3 ${action.color} text-white rounded-lg transition-colors`}
                        >
                            <action.icon className="w-5 h-5" />
                            <span className="font-medium">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-500" />
                            Recent Activity
                        </h2>
                        <Link href="/admin/activity" className="text-sm text-primary-400 hover:text-primary-300">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats?.recentActivity?.length ? (
                            stats.recentActivity.slice(0, 5).map((activity: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                    <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                                        <p className="text-gray-500 text-xs">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Status */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Content Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <span className="text-gray-300">Published Exams</span>
                            </div>
                            <span className="text-white font-semibold">{stats?.publishedExams || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <span className="text-gray-300">Published Questions</span>
                            </div>
                            <span className="text-white font-semibold">{stats?.publishedQuestions || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-gray-300">Draft Content</span>
                            </div>
                            <span className="text-white font-semibold">
                                {((stats?.totalExams || 0) - (stats?.publishedExams || 0)) + ((stats?.totalQuestions || 0) - (stats?.publishedQuestions || 0))}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-300">Active Users (Today)</span>
                            </div>
                            <span className="text-white font-semibold">-</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Links */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                    href="/admin/exams"
                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                        <div>
                            <p className="text-white font-medium">Manage Exams</p>
                            <p className="text-gray-500 text-sm">Edit, publish, add sections</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                </Link>

                <Link
                    href="/admin/questions"
                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-500/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-purple-500" />
                        <div>
                            <p className="text-white font-medium">Manage Questions</p>
                            <p className="text-gray-500 text-sm">Section-wise, edit, publish</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-500 transition-colors" />
                </Link>

                <Link
                    href="/admin/tests"
                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-emerald-500/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-500" />
                        <div>
                            <p className="text-white font-medium">Manage Mock Tests</p>
                            <p className="text-gray-500 text-sm">Create, edit, publish</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-500 transition-colors" />
                </Link>
            </div>
        </div>
    );
}
