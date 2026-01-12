'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Bookmark,
    BookmarkCheck,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
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
    options: { id: string; text: string }[];
    difficulty: string;
    subject: { name: string; slug: string };
    topic: { name: string; slug: string } | null;
    exams?: Exam[];
    userAttempt: { isCorrect: boolean } | null;
}

export default function QuestionsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        exam: '',
        subject: '',
        difficulty: '',
        search: '',
    });
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
    const [solutions, setSolutions] = useState<Record<string, any>>({});
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadSubjects();
        loadExams();
    }, []);

    useEffect(() => {
        if (user) {
            loadQuestions();
        }
    }, [user, filters.subject, filters.difficulty, filters.exam]);

    const loadSubjects = async () => {
        try {
            const response = await api.get<Subject[]>('/subjects');
            if (response.success) {
                setSubjects(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load subjects:', error);
        }
    };

    const loadExams = async () => {
        try {
            // Use the dedicated endpoint to get all active exams with questions (Phase 1 Fix)
            const response = await api.get<{ exams: Exam[] }>('/exams/with-questions');
            if (response.success) {
                setExams(response.data?.exams || []);
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        }
    };

    const loadQuestions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.exam) params.append('exam', filters.exam);
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);

            const response = await api.get<{ questions: Question[] }>(`/questions?${params.toString()}&limit=50`);
            if (response.success) {
                setQuestions(response.data?.questions || []);
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (questionId: string, optionId: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const checkAnswer = async (questionId: string) => {
        try {
            const response = await api.get(`/questions/${questionId}/solution`);
            if (response.success && response.data) {
                setSolutions(prev => ({ ...prev, [questionId]: response.data }));
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

    if (!user && !authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please login to access the question bank
                    </p>
                    <a href="/login" className="btn btn-primary">Login</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 lg:py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                        Question Bank
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Practice from 1 lakh+ questions with detailed solutions. Filter by subject and difficulty.
                    </p>
                </div>

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
                        <option value="">All Exams (Updated)</option>
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
                                                {idx + 1}
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
                                            const isCorrect = solution?.correctAnswer === option.id;
                                            const showResult = showSolution[question.id];

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => !showResult && handleAnswerSelect(question.id, option.id)}
                                                    disabled={showResult}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${showResult
                                                        ? isCorrect
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
                                                            ? isCorrect
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
                                                        {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                                        {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
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
            </div>
        </div>
    );
}
