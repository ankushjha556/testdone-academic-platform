'use client';

import { useAuth } from '@/contexts/AuthContext';
import { BarChart2, TrendingUp, Target, Clock } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Performance Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400">Detailed breakdown of your strengths and weaknesses.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Overall Accuracy', value: '0%', icon: Target, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Avg. Time/Question', value: '0s', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Tests Completed', value: '0', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-100' },
                        { label: 'Topics Mastered', value: '0', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
                    ].map((stat, i) => (
                        <div key={i} className="card p-5 bg-white dark:bg-gray-900 shadow rounded-xl flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} dark:bg-opacity-20`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card p-12 text-center bg-white dark:bg-gray-900 shadow rounded-xl">
                    <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Not Enough Data</h3>
                    <p className="text-gray-500">
                        Take more mock tests to unlock detailed performance insights and personalized recommendations.
                    </p>
                </div>
            </div>
        </div>
    );
}
