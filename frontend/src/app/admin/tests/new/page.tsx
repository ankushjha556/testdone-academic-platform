'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Save,
    Loader2,
} from 'lucide-react';

interface DropdownItem {
    id: string;
    name: string;
}

export default function NewTestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exams, setExams] = useState<DropdownItem[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        instructions: '',
        examId: '',
        testType: 'FULL_LENGTH' as string,
        accessType: 'FREE' as string,
        durationMinutes: 60,
        totalMarks: 100,
        totalQuestions: 50,
        passingPercent: 35,
        negativeMarking: 0.25,
        sectionalTiming: false,
        status: 'DRAFT',
    });

    useEffect(() => {
        loadExams();
    }, []);

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !formData.slug) {
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name]);

    const loadExams = async () => {
        try {
            const res = await api.get<{ exams: DropdownItem[] }>('/admin/exams');
            // Backend returns { success, data: { exams: [...] } }
            if (res.success && res.data) {
                const data = res.data as any;
                const exams = data.exams || [];
                setExams(exams.map((e: any) => ({ id: e.id, name: e.name })));
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.examId) {
            alert('Please select an exam category');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/admin/tests', formData);
            if (res.success) {
                alert('Test created successfully!');
                router.push('/admin/tests');
            } else {
                alert('Failed to create test: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save test');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/tests" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Create Mock Test</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Slug (auto-generated)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows={3}
                                    placeholder="Instructions for test-takers..."
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Exam Category *</label>
                                <select
                                    value={formData.examId}
                                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                >
                                    <option value="">Select Exam</option>
                                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Test Type *</label>
                                <select
                                    value={formData.testType}
                                    onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                >
                                    <option value="FULL_LENGTH">Full Length</option>
                                    <option value="SECTIONAL">Sectional</option>
                                    <option value="TOPIC">Topic-wise</option>
                                    <option value="PREVIOUS_YEAR">Previous Year</option>
                                    <option value="CHAPTER">Chapter-wise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Access Type</label>
                                <select
                                    value={formData.accessType}
                                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="FREE">Free</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="SCHEDULED_FREE">Scheduled Free</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Questions</label>
                                    <input
                                        type="number"
                                        value={formData.totalQuestions}
                                        onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Marks</label>
                                    <input
                                        type="number"
                                        value={formData.totalMarks}
                                        onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        value={formData.durationMinutes}
                                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Passing % (1-100)</label>
                                    <input
                                        type="number"
                                        value={formData.passingPercent}
                                        onChange={(e) => setFormData({ ...formData, passingPercent: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        min={1}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Negative Marking</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.negativeMarking}
                                    onChange={(e) => setFormData({ ...formData, negativeMarking: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="e.g., 0.25 for -0.25 per wrong answer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.sectionalTiming}
                                    onChange={(e) => setFormData({ ...formData, sectionalTiming: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-300">Sectional Timing</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Create Test
                    </button>
                </div>
            </form>
        </div>
    );
}
