'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
    BookOpen,
    Users,
    Clock,
    Award,
    ChevronRight,
    FileText,
    Target,
    Calendar,
    IndianRupee,
    GraduationCap,
    Loader2,
    Play,
} from 'lucide-react';

interface Exam {
    id: string;
    name: string;
    slug: string;
    fullName: string;
    description: string;
    eligibility: string;
    syllabus: any;
    examPattern: any;
    conductingBody: string;
    frequency: string;
    vacancies: string;
    salaryRange: string;
    iconUrl: string;
    color: string;
    testsCount: number;
    questionsCount: number;
    relatedExams: { id: string; name: string; slug: string }[];
}

interface Test {
    id: string;
    name: string;
    slug: string;
    testType: string;
    totalQuestions: number;
    durationMinutes: number;
    accessType: string;
    attemptsCount: number;
}

export default function ExamDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadExamData();
    }, [slug]);

    const loadExamData = async () => {
        setIsLoading(true);
        try {
            const [examRes, testsRes] = await Promise.all([
                api.get<Exam>(`/exams/${slug}`),
                api.get<{ tests: Test[] }>(`/exams/${slug}/tests?limit=10`),
            ]);

            if (examRes.success) {
                setExam(examRes.data!);
            }
            if (testsRes.success) {
                setTests(testsRes.data?.tests || []);
            }
        } catch (error) {
            console.error('Failed to load exam:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam Not Found</h1>
                    <Link href="/exams" className="text-primary-600 hover:underline">
                        Browse all exams
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section
                className="py-12 lg:py-16"
                style={{ background: `linear-gradient(135deg, ${exam.color}20, ${exam.color}05)` }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                            style={{ backgroundColor: exam.color }}
                        >
                            {exam.name.charAt(0)}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-2">
                                {exam.name} Exam Preparation
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                                {exam.fullName} | {exam.conductingBody}
                            </p>

                            <div className="flex flex-wrap gap-4 mb-6">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <BookOpen className="w-5 h-5" />
                                    <span>{exam.testsCount} Mock Tests</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <FileText className="w-5 h-5" />
                                    <span>{exam.questionsCount.toLocaleString()} Questions</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-5 h-5" />
                                    <span>{exam.frequency}</span>
                                </div>
                                {exam.vacancies && (
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Users className="w-5 h-5" />
                                        <span>{exam.vacancies} Vacancies</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href={`/exams/${slug}/tests`} className="btn btn-primary btn-lg">
                                    <Play className="w-5 h-5" />
                                    Start Free Mock Test
                                </Link>
                                <Link href={`/exams/${slug}/syllabus`} className="btn btn-secondary btn-lg">
                                    View Syllabus
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 bg-white dark:bg-gray-900 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-8 overflow-x-auto">
                        {['overview', 'syllabus', 'mock-tests', 'questions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'overview' && (
                            <>
                                {/* Description */}
                                <div className="card p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        About {exam.name}
                                    </h2>
                                    <div
                                        className="prose dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: exam.description || 'No description available.' }}
                                    />
                                </div>

                                {/* Eligibility */}
                                {exam.eligibility && (
                                    <div className="card p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                            Eligibility Criteria
                                        </h2>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: exam.eligibility }}
                                        />
                                    </div>
                                )}

                                {/* Featured Mock Tests */}
                                <div className="card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Free Mock Tests
                                        </h2>
                                        <Link
                                            href={`/exams/${slug}/tests`}
                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            View All
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {tests.length > 0 ? tests.slice(0, 5).map((test) => (
                                            <Link
                                                key={test.id}
                                                href={`/tests/${test.slug}`}
                                                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                        <BookOpen className="w-5 h-5 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{test.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {test.totalQuestions} Qs • {test.durationMinutes} mins
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`badge ${test.accessType === 'FREE' ? 'badge-success' : 'badge-warning'}`}>
                                                        {test.accessType}
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                                                </div>
                                            </Link>
                                        )) : (
                                            <p className="text-gray-500 text-center py-8">No tests available yet</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'syllabus' && exam.syllabus && (
                            <div className="card p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    {exam.name} Syllabus
                                </h2>
                                {Object.entries(exam.syllabus).map(([stage, sections]: [string, any]) => (
                                    <div key={stage} className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 capitalize">
                                            {stage.replace('_', ' ')}
                                        </h3>
                                        <div className="space-y-3">
                                            {Array.isArray(sections) && sections.map((section: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {section.section}
                                                        </h4>
                                                        <span className="text-sm text-gray-500">
                                                            {section.questions} Qs • {section.marks} Marks
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Info</h3>
                            <div className="space-y-4">
                                {exam.salaryRange && (
                                    <div className="flex items-center gap-3">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Salary Range</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{exam.salaryRange}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5 text-primary-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">Conducting Body</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{exam.conductingBody}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">Exam Frequency</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{exam.frequency}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Exams */}
                        {exam.relatedExams && exam.relatedExams.length > 0 && (
                            <div className="card p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Exams</h3>
                                <div className="space-y-2">
                                    {exam.relatedExams.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/exams/${related.slug}`}
                                            className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white">{related.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
