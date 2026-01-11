'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    MoreVertical,
    HelpCircle,
    Check,
    Loader2,
    Filter,
} from 'lucide-react';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    difficulty: string;
    status: string;
    subject?: { name: string };
    topic?: { name: string };
    section?: { name: string };
    createdAt: string;
}

export default function QuestionsListPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    useEffect(() => {
        loadQuestions();
    }, [statusFilter, difficultyFilter]);

    const loadQuestions = async (page = 1) => {
        setLoading(true);
        try {
            let url = `/admin/questions?page=${page}&limit=20`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (difficultyFilter !== 'all') url += `&difficulty=${difficultyFilter}`;

            const res = await api.get<{ questions: Question[]; pagination: any }>(url);
            // Backend returns { success, data: { questions: [...], pagination: {...} } }
            if (res.success && res.data) {
                const data = res.data as any;
                setQuestions(data.questions || []);
                setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            const res = await api.patch(`/admin/questions/${id}/status`, { status: newStatus });
            if (res.success) {
                setQuestions(questions.map(q => q.id === id ? { ...q, status: newStatus } : q));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to update status');
        }
        setActionMenu(null);
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm('Delete this question? This cannot be undone.')) return;

        setDeleting(id);
        try {
            const res = await api.delete(`/admin/questions/${id}`);
            if (res.success) {
                setQuestions(questions.filter(q => q.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete question');
        } finally {
            setDeleting(null);
            setActionMenu(null);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const text = q.questionText.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Questions</h1>
                    <p className="text-gray-400">Manage question bank</p>
                </div>
                <Link
                    href="/admin/questions/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Add Question
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                </select>
                <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
            </div>

            {/* Questions Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Question</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden md:table-cell">Subject</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Difficulty</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                            <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredQuestions.map((question) => (
                            <tr key={question.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <HelpCircle className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm truncate max-w-md">
                                                {stripHtml(question.questionText)}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {question.questionType}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-gray-300">{question.subject?.name || '-'}</span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${question.difficulty === 'EASY'
                                        ? 'bg-green-500/20 text-green-400'
                                        : question.difficulty === 'MEDIUM'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {question.difficulty}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${question.status === 'PUBLISHED'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {question.status === 'PUBLISHED' && <Check className="w-3 h-3" />}
                                        {question.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/questions/${question.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActionMenu(actionMenu === question.id ? null : question.id)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {actionMenu === question.id && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                                    <button
                                                        onClick={() => toggleStatus(question.id, question.status)}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700"
                                                    >
                                                        {question.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        {question.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteQuestion(question.id)}
                                                        disabled={deleting === question.id}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-gray-700"
                                                    >
                                                        {deleting === question.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredQuestions.length === 0 && (
                    <div className="text-center py-12">
                        <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No questions found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => loadQuestions(page)}
                            className={`px-3 py-1.5 rounded ${page === pagination.currentPage
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
