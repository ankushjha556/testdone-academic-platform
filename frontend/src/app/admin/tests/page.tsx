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
    FileText,
    Check,
    Loader2,
    Clock,
    Users,
} from 'lucide-react';

interface MockTest {
    id: string;
    title: string;
    slug: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    status: string;
    exam?: { name: string };
    _count?: { testQuestions: number; attempts: number };
    createdAt: string;
}

export default function TestsListPage() {
    const [tests, setTests] = useState<MockTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadTests();
    }, [statusFilter]);

    const loadTests = async () => {
        try {
            let url = '/admin/tests';
            if (statusFilter !== 'all') url += `?status=${statusFilter}`;

            const res = await api.get<{ tests: MockTest[] }>(url);
            // Backend returns { success, data: { tests: [...] } }
            if (res.success && res.data) {
                const data = res.data as any;
                setTests(data.tests || []);
            }
        } catch (error) {
            console.error('Failed to load tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            const res = await api.patch(`/admin/tests/${id}`, { status: newStatus });
            if (res.success) {
                setTests(tests.map(t => t.id === id ? { ...t, status: newStatus } : t));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to update status');
        }
        setActionMenu(null);
    };

    const deleteTest = async (id: string) => {
        if (!confirm('Delete this test? This cannot be undone.')) return;

        setDeleting(id);
        try {
            const res = await api.delete(`/admin/tests/${id}`);
            if (res.success) {
                setTests(tests.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete test');
        } finally {
            setDeleting(null);
            setActionMenu(null);
        }
    };

    const filteredTests = tests.filter(t =>
        (t.title || '').toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-white">Mock Tests</h1>
                    <p className="text-gray-400">Manage mock tests and practice exams</p>
                </div>
                <Link
                    href="/admin/tests/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Create Test
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search tests..."
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
            </div>

            {/* Tests Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => (
                    <div
                        key={test.id}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setActionMenu(actionMenu === test.id ? null : test.id)}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {actionMenu === test.id && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                        <Link
                                            href={`/admin/tests/${test.id}/edit`}
                                            className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:bg-gray-700"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => toggleStatus(test.id, test.status)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700"
                                        >
                                            {test.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            {test.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button
                                            onClick={() => deleteTest(test.id)}
                                            disabled={deleting === test.id}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-gray-700"
                                        >
                                            {deleting === test.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-white font-semibold mb-1">{test.title}</h3>
                        <p className="text-gray-500 text-sm mb-4">{test.exam?.name || 'No exam'}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {test.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {test._count?.attempts || 0}
                            </span>
                            <span>{test._count?.testQuestions || 0} Q</span>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${test.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {test.status === 'PUBLISHED' && <Check className="w-3 h-3" />}
                            {test.status}
                        </span>
                    </div>
                ))}
            </div>

            {filteredTests.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No tests found</p>
                    <Link href="/admin/tests/new" className="text-primary-400 hover:text-primary-300 text-sm">
                        Create your first test
                    </Link>
                </div>
            )}
        </div>
    );
}
