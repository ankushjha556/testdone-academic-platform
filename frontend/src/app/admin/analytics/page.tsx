'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Users,
    FileText,
    BookOpen,
    TestTube,
    TrendingUp,
    Calendar,
    Loader2,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalExams: number;
    totalTests: number;
    totalQuestions: number;
    totalSubjects: number;
    activeSubscriptions: number;
    todayRegistrations: number;
}

interface DailyStats {
    date: string;
    users: number;
    tests: number;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await api.get<any>('/admin/stats');
            if (res.success) {
                // Backend returns stats directly, not in data wrapper
                setStats(res.stats || res.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const statCards = [
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500', change: '+12%' },
        { title: 'Total Exams', value: stats?.totalExams || 0, icon: FileText, color: 'bg-green-500', change: '+5%' },
        { title: 'Mock Tests', value: stats?.totalTests || 0, icon: TestTube, color: 'bg-purple-500', change: '+8%' },
        { title: 'Questions', value: stats?.totalQuestions || 0, icon: BookOpen, color: 'bg-orange-500', change: '+15%' },
        { title: 'Subjects', value: stats?.totalSubjects || 0, icon: TrendingUp, color: 'bg-pink-500', change: '0%' },
        { title: 'Active Subscriptions', value: stats?.activeSubscriptions || 0, icon: Calendar, color: 'bg-teal-500', change: '+3%' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <div className="text-sm text-gray-400">
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">{card.title}</p>
                                <p className="text-3xl font-bold text-white mt-2">{card.value.toLocaleString()}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${card.color}`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            {card.change.startsWith('+') ? (
                                <ArrowUp className="w-4 h-4 text-green-500" />
                            ) : (
                                <ArrowDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                {card.change}
                            </span>
                            <span className="text-gray-500 text-sm">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Today's Activity */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Today's Activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-4xl font-bold text-primary-500">{stats?.todayRegistrations || 0}</p>
                        <p className="text-gray-400 mt-2">New Registrations</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-4xl font-bold text-green-500">0</p>
                        <p className="text-gray-400 mt-2">Tests Attempted</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-4xl font-bold text-orange-500">0</p>
                        <p className="text-gray-400 mt-2">Questions Answered</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <a href="/admin/questions/new" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                        Add Question
                    </a>
                    <a href="/admin/tests/new" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        Create Mock Test
                    </a>
                    <a href="/admin/exams/new" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        Add Exam
                    </a>
                    <a href="/admin/books/new" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                        Upload Book
                    </a>
                </div>
            </div>
        </div>
    );
}
