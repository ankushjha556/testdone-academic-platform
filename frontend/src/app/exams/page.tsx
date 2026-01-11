'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Search, Filter, ChevronRight, BookOpen, Users, Loader2 } from 'lucide-react';

interface ExamCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    examsCount: number;
}

interface Exam {
    id: string;
    name: string;
    slug: string;
    fullName: string;
    conductingBody: string;
    color: string;
    isFeatured: boolean;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    testsCount: number;
    questionsCount: number;
}

export default function ExamsPage() {
    const [categories, setCategories] = useState<ExamCategory[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedCategory, searchQuery]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [catResponse, examResponse] = await Promise.all([
                api.get<{ categories: ExamCategory[] }>('/exams/categories'),
                api.get<{ exams: Exam[] }>(`/exams?category=${selectedCategory}&search=${searchQuery}&limit=50`),
            ]);

            if (catResponse.success) {
                setCategories(catResponse.data?.categories || []);
            }
            if (examResponse.success) {
                setExams(examResponse.data?.exams || []);
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                        All Competitive Exams
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Choose from 250+ competitive exams. Get access to mock tests, question banks, and study materials.
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input w-full sm:w-48"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === ''
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.slug
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {cat.name} ({cat.examsCount})
                        </button>
                    ))}
                </div>

                {/* Exams Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 dark:text-gray-400">No exams found</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams?.map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/exams/${exam.slug}`}
                                className="card p-6 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                        style={{ backgroundColor: exam.color || '#6366F1' }}
                                    >
                                        {exam.name.charAt(0)}
                                    </div>
                                    {exam.isFeatured && (
                                        <span className="badge badge-primary">Popular</span>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    {exam.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    {exam.fullName || exam.conductingBody}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {exam.testsCount} Tests
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {Math.floor(exam.questionsCount / 1000)}K+ Qs
                                        </span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
