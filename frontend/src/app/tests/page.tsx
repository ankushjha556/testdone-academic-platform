'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Search, Filter, BookOpen, Clock, Users, Play, Crown, Loader2 } from 'lucide-react';

interface Test {
    id: string;
    name: string;
    slug: string;
    description: string;
    testType: string;
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
    accessType: string;
    isAllIndia: boolean;
    attemptsCount: number;
    exam: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function TestsPage() {
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        access: '',
        search: '',
    });

    useEffect(() => {
        loadTests();
    }, [filters]);

    const loadTests = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.access) params.append('access', filters.access);

            const response = await api.get<{ tests: Test[] }>(`/tests?${params.toString()}&limit=50`);
            if (response.success) {
                setTests(response.data?.tests || []);
            }
        } catch (error) {
            console.error('Failed to load tests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        test.exam.name.toLowerCase().includes(filters.search.toLowerCase())
    );

    return (
        <div className="min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                        Mock Tests
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Practice with 5000+ mock tests for Banking, SSC, Railway, and other competitive exams.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tests..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="input pl-10"
                        />
                    </div>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="input w-full sm:w-40"
                    >
                        <option value="">All Types</option>
                        <option value="FULL_LENGTH">Full Length</option>
                        <option value="SECTIONAL">Sectional</option>
                        <option value="TOPIC">Topic</option>
                        <option value="PREVIOUS_YEAR">Previous Year</option>
                    </select>
                    <select
                        value={filters.access}
                        onChange={(e) => setFilters({ ...filters, access: e.target.value })}
                        className="input w-full sm:w-32"
                    >
                        <option value="">All</option>
                        <option value="FREE">Free</option>
                        <option value="PREMIUM">Premium</option>
                    </select>
                </div>

                {/* Tests Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No tests found</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTests.map((test) => (
                            <div key={test.id} className="card overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`badge ${test.accessType === 'FREE' ? 'badge-success' : 'badge-warning'
                                            }`}>
                                            {test.accessType === 'FREE' ? 'Free' : (
                                                <span className="flex items-center gap-1">
                                                    <Crown className="w-3 h-3" />
                                                    Premium
                                                </span>
                                            )}
                                        </span>
                                        {test.isAllIndia && (
                                            <span className="badge badge-primary">All India</span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {test.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {test.exam.name}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {test.totalQuestions} Qs
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {test.durationMinutes} mins
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {(test.attemptsCount / 1000).toFixed(1)}K
                                        </span>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <Link
                                        href={`/tests/${test.slug}`}
                                        className="btn btn-primary w-full"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start Test
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
