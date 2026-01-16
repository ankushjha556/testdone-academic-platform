'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Search,
    Loader2,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    XCircle,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
    id: string;
    name: string;
    slug: string;
    topicsCount: number;
}

interface Exam {
    id: string;
    name: string;
    slug: string;
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    options: { id: string; text: string; isCorrect?: boolean }[];
    difficulty: string;
    subject: { name: string; slug: string };
    topic: { name: string; slug: string } | null;
    exams?: Exam[];
    userAttempt: { isCorrect: boolean } | null;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
}

import { useSearchParams } from 'next/navigation';
// ... imports

export default function QuestionsClient() {
    const { user, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        exam: searchParams.get('exam') || '',
        subject: searchParams.get('subject') || '',
        difficulty: searchParams.get('difficulty') || '',
        search: searchParams.get('search') || '',
    });
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
    const [solutions, setSolutions] = useState<Record<string, any>>({});
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 50
    });
    const [isPremiumRequired, setIsPremiumRequired] = useState(false);

    useEffect(() => {
        loadSubjects();
        loadExams();
    }, []);

    useEffect(() => {
        if (user) {
            loadQuestions(1);
        } else {
            setIsLoading(false); // Stop loading if not auth (we show CTA)
        }
    }, [user, filters.subject, filters.difficulty, filters.exam]);

    const loadSubjects = async () => {
        try {
            // Load only subjects that have published questions
            const response = await api.get<{ subjects: Subject[] }>('/subjects/with-questions');
            if (response.success) {
                setSubjects(response.data?.subjects || []);
            }
        } catch (error) {
            console.error('Failed to load subjects:', error);
        }
    };

    const loadExams = async () => {
        try {
            const response = await api.get<{ exams: Exam[] }>('/exams/with-questions');
            if (response.success) {
                setExams(response.data?.exams || []);
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        }
    };

    const loadQuestions = async (page = 1) => {
        setIsLoading(true);
        setIsPremiumRequired(false);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '50');
            if (filters.exam) params.append('exam', filters.exam);
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);

            const response = await api.get<{ questions: Question[], pagination: Pagination }>(`/questions?${params.toString()}`);
            if (response.success) {
                setQuestions(response.data?.questions || []);
                if (response.data?.pagination) {
                    setPagination(response.data.pagination);
                }
            } else if (response.error?.code === 'PREMIUM_REQUIRED') {
                // User is logged in but not premium
                setIsPremiumRequired(true);
                setQuestions([]);
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadQuestions(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleAnswerSelect = (questionId: string, optionId: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const checkAnswer = async (questionId: string) => {
        try {
            const response = await api.get(`/questions/${questionId}/solution`);
            if (response.success && response.data) {
                // Find the correct option from the question's options using isCorrect field
                const question = questions.find(q => q.id === questionId);
                const correctOption = question?.options.find(o => o.isCorrect === true);
                const solutionData = {
                    ...response.data,
                    // Use isCorrect field from options as source of truth for correct answer
                    correctOptionId: correctOption?.id || response.data.correctAnswer
                };
                setSolutions(prev => ({ ...prev, [questionId]: solutionData }));
                setShowSolution(prev => ({ ...prev, [questionId]: true }));
            }
        } catch (error) {
            toast.error('Failed to load solution');
        }
    };

    const toggleBookmark = async (questionId: string) => {
        try {
            const response = await api.post(`/questions/${questionId}/bookmark`);
            if (response.success) {
                setBookmarks(prev => {
                    const next = new Set(prev);
                    if (next.has(questionId)) {
                        next.delete(questionId);
                        toast.success('Bookmark removed');
                    } else {
                        next.add(questionId);
                        toast.success('Question bookmarked');
                    }
                    return next;
                });
            }
        } catch (error) {
            toast.error('Failed to update bookmark');
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.questionText.toLowerCase().includes(filters.search.toLowerCase())
    );

    // Auth Check: If not logged in, show Login CTA
    if (!user && !authLoading) {
        return (
            <div className="my-12 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center border border-gray-200 dark:border-gray-700">
                <Lock className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Unlock 1 Lakh+ Practice Questions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                    Join TestDone to access our complete question bank with detailed solutions, difficulty filters, and performance tracking.
                </p>
                <div className="flex justify-center gap-4">
                    <a href="/login" className="btn btn-primary">Login to Practice</a>
                    <a href="/signup" className="btn btn-outline">Create Free Account</a>
                </div>
            </div>
        );
    }

    // Premium Check: If logged in but not premium, show upgrade CTA
    if (isPremiumRequired) {
        return (
            <div className="my-12 p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl text-center border border-amber-200 dark:border-amber-800">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Premium Feature
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                    The Question Bank with 1 Lakh+ practice questions is a premium feature.
                    Upgrade now to get unlimited access to all questions, detailed solutions, and performance analytics.
                </p>
                <div className="flex justify-center gap-4">
                    <a href="/pricing" className="btn btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0">
                        Upgrade to Premium
                    </a>
                    <a href="/tests" className="btn btn-outline">Try Free Mock Tests</a>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="input pl-10"
                    />
                </div>
                <select
                    value={filters.exam}
                    onChange={(e) => setFilters({ ...filters, exam: e.target.value })}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Exams</option>
                    {exams.map((exam) => (
                        <option key={exam.id} value={exam.slug}>{exam.name}</option>
                    ))}
                </select>
                <select
                    value={filters.subject}
                    onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Subjects</option>
                    {subjects.map((sub) => (
                        <option key={sub.id} value={sub.slug}>{sub.name}</option>
                    ))}
                </select>
                <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="input w-full sm:w-36"
                >
                    <option value="">All Levels</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
            </div>

            {/* Questions */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400">No questions found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuestions.map((question, idx) => (
                        <div key={question.id} className="card overflow-hidden">
                            <div className="p-5">
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-primary-600">
                                            {((pagination.currentPage - 1) * pagination.perPage) + idx + 1}
                                        </span>
                                        <div className="flex gap-2 flex-wrap">
                                            {question.exams && question.exams.length > 0 && (
                                                <span className="badge badge-primary bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                    {question.exams[0].name}
                                                </span>
                                            )}
                                            <span className="badge badge-primary">{question.subject.name}</span>
                                            <span className={`badge ${question.difficulty === 'EASY' ? 'badge-success' :
                                                question.difficulty === 'MEDIUM' ? 'badge-warning' :
                                                    'badge-error'
                                                }`}>
                                                {question.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleBookmark(question.id)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        {bookmarks.has(question.id) ? (
                                            <BookmarkCheck className="w-5 h-5 text-primary-600" />
                                        ) : (
                                            <Bookmark className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {/* Question Text */}
                                <div
                                    className="text-gray-900 dark:text-white mb-4 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: question.questionText }}
                                />

                                {/* Options */}
                                <div className="space-y-2 mb-4">
                                    {question.options.map((option) => {
                                        const isSelected = selectedAnswers[question.id] === option.id;
                                        const solution = solutions[question.id];
                                        // Use isCorrect from option (source of truth) or fallback to correctOptionId from solution
                                        const isCorrectOption = option.isCorrect === true || solution?.correctOptionId === option.id;
                                        const showResult = showSolution[question.id];

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => !showResult && handleAnswerSelect(question.id, option.id)}
                                                disabled={showResult}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${showResult
                                                    ? isCorrectOption
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : isSelected
                                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                            : 'border-gray-200 dark:border-gray-700'
                                                    : isSelected
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${showResult
                                                        ? isCorrectOption
                                                            ? 'bg-green-500 text-white'
                                                            : isSelected
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                                        : isSelected
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                                        }`}>
                                                        {option.id}
                                                    </span>
                                                    <span className="flex-1">{option.text}</span>
                                                    {showResult && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                                    {showResult && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-500" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Check Answer Button */}
                                {!showSolution[question.id] && selectedAnswers[question.id] && (
                                    <button
                                        onClick={() => checkAnswer(question.id)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Check Answer
                                    </button>
                                )}

                                {/* Solution */}
                                {showSolution[question.id] && solutions[question.id] && (
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Solution:</p>
                                        <div
                                            className="text-blue-700 dark:text-blue-200"
                                            dangerouslySetInnerHTML={{ __html: solutions[question.id].solution || 'Solution not available' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {questions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems} questions
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="btn btn-outline btn-sm"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Page {pagination.currentPage}
                            </span>
                            <span className="text-sm text-gray-500">
                                of {pagination.totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="btn btn-outline btn-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
