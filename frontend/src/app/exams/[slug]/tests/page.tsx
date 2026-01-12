'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, BookOpen, Clock, Users, Play, Crown, Loader2, ArrowLeft, Filter } from 'lucide-react';

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
    exam?: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function ExamTestsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        access: '',
        search: '',
    });

    useEffect(() => {
        loadTests();
    }, [slug, filters.type, filters.access]); // search handled in client filtering for now or debounce

    const loadTests = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.access) queryParams.append('access', filters.access);

            // Backend endpoint for exam tests
            const response = await api.get<{ tests: Test[] }>(`/exams/${slug}/tests?${queryParams.toString()}`);

            if (response.success) {
                setTests(response.data?.tests || []);
            }
        } catch (error) {
            console.error('Failed to load tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(filters.search.toLowerCase())
    );

    return (
        <div className="min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/exams/${slug}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Exam Details
                    </Link>
                    <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">
                        Available Mock Tests
                    </h1>
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
                            className="w-full pl-10 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
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
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                    >
                        <option value="">All Access</option>
                        <option value="FREE">Free</option>
                        <option value="PREMIUM">Premium</option>
                    </select>
                </div>

                {/* Tests Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No tests found for this exam.</p>
                        {/* <button onClick={() => loadTests()} className="mt-4 text-primary-600 hover:underline">Refresh</button> */}
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTests.map((test) => (
                            <div key={test.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all shadow-sm hover:shadow-md">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${test.accessType === 'FREE'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            {test.accessType === 'FREE' ? 'Free' : (
                                                <span className="flex items-center gap-1">
                                                    <Crown className="w-3 h-3" />
                                                    Premium
                                                </span>
                                            )}
                                        </span>
                                        {test.isAllIndia && (
                                            <span className="px-2 py-1 text-xs font-semibold rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                                All India
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                                        {test.name}
                                    </h3>

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
                                            {test.attemptsCount > 0 ? (test.attemptsCount / 1000).toFixed(1) + 'K' : 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <Link
                                        href={`/tests/${test.slug}`}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
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
