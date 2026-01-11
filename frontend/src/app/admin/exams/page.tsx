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
    BookOpen,
    Check,
    X,
    Filter,
    Loader2,
} from 'lucide-react';

interface Exam {
    id: string;
    name: string;
    slug: string;
    fullName?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isFeatured: boolean;
    category: { name: string };
    _count?: { mockTests: number; questionExams: number };
    createdAt: string;
}

export default function ExamsListPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            const res = await api.get<{ exams: Exam[] }>('/admin/exams');
            // Backend returns { success, data: { exams: [...] } }
            if (res.success && res.data) {
                const data = res.data as any;
                const exams = data.exams || [];
                setExams(exams);
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            const res = await api.patch(`/admin/exams/${id}`, { status: newStatus });
            if (res.success) {
                setExams(exams.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
            } else {
                alert('Failed to update status: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to update exam status');
        }
        setActionMenu(null);
    };

    const deleteExam = async (id: string) => {
        if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            return;
        }
        setDeleting(id);
        try {
            const res = await api.delete(`/admin/exams/${id}`);
            if (res.success) {
                setExams(exams.filter(e => e.id !== id));
            } else {
                alert('Failed to delete exam: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to delete exam:', error);
            alert('Failed to delete exam');
        } finally {
            setDeleting(null);
            setActionMenu(null);
        }
    };

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.name.toLowerCase().includes(search.toLowerCase()) ||
            exam.slug.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="text-2xl font-bold text-white">Exams</h1>
                    <p className="text-gray-400">Manage all exams and their sections</p>
                </div>
                <Link
                    href="/admin/exams/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Add New Exam
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search exams..."
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
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* Exams Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Exam Name</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden md:table-cell">Category</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Tests</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Questions</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                            <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredExams.map((exam) => (
                            <tr key={exam.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{exam.name}</p>
                                            <p className="text-gray-500 text-sm">{exam.slug}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-gray-300">{exam.category?.name || '-'}</span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className="text-gray-300">{exam._count?.mockTests || 0}</span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className="text-gray-300">{exam._count?.questionExams || 0}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${exam.status === 'PUBLISHED'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : exam.status === 'DRAFT'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {exam.status === 'PUBLISHED' ? <Check className="w-3 h-3" /> : null}
                                        {exam.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/exams/${exam.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/exams/${exam.id}/sections`}
                                            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Manage Sections"
                                        >
                                            <Filter className="w-4 h-4" />
                                        </Link>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActionMenu(actionMenu === exam.id ? null : exam.id)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {actionMenu === exam.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                                    <button
                                                        onClick={() => toggleStatus(exam.id, exam.status)}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700 transition-colors"
                                                    >
                                                        {exam.status === 'PUBLISHED' ? (
                                                            <>
                                                                <EyeOff className="w-4 h-4" />
                                                                Unpublish
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4" />
                                                                Publish
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteExam(exam.id)}
                                                        disabled={deleting === exam.id}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-gray-700 transition-colors"
                                                    >
                                                        {deleting === exam.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
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

                {filteredExams.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No exams found</p>
                        <Link href="/admin/exams/new" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                            Create your first exam
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
