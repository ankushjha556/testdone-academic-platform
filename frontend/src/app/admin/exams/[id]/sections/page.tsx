'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    GripVertical,
    Loader2,
    Folder,
    Save,
    X,
} from 'lucide-react';

interface Section {
    id: string;
    name: string;
    slug: string;
    description?: string;
    order: number;
    _count?: { questions: number };
}

interface Exam {
    id: string;
    name: string;
}

export default function SectionsManagementPage() {
    const params = useParams();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<Exam | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Section | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        loadData();
    }, [examId]);

    const loadData = async () => {
        try {
            const [examRes, sectionsRes] = await Promise.all([
                api.get<{ exam: Exam }>(`/exams/${examId}`),
                api.get<Section[]>(`/admin/exams/${examId}/sections`),
            ]);

            if (examRes.success && examRes.data?.exam) {
                setExam(examRes.data.exam);
            }

            if (sectionsRes.success && sectionsRes.data) {
                setSections(sectionsRes.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditing(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const openEditModal = (section: Section) => {
        setEditing(section);
        setFormData({ name: section.name, description: section.description || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editing) {
                // Update existing
                const res = await api.put(`/admin/sections/${editing.id}`, formData);
                if (res.success) {
                    setSections(sections.map(s => s.id === editing.id ? { ...s, ...formData } : s));
                    setShowModal(false);
                }
            } else {
                // Create new
                const res = await api.post(`/admin/exams/${examId}/sections`, {
                    ...formData,
                    order: sections.length,
                });
                if (res.success && res.data) {
                    setSections([...sections, res.data]);
                    setShowModal(false);
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save section');
        } finally {
            setSaving(false);
        }
    };

    const deleteSection = async (id: string) => {
        if (!confirm('Delete this section? Questions will be unassigned.')) return;

        try {
            const res = await api.delete(`/admin/sections/${id}`);
            if (res.success) {
                setSections(sections.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete section');
        }
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/exams/${examId}/edit`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Sections</h1>
                        <p className="text-gray-400">{exam?.name}</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Section
                </button>
            </div>

            {/* Info */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                    Sections help organize questions by topic (e.g., Quantitative Aptitude, Reasoning, English).
                    You can assign questions to sections when creating or editing them.
                </p>
            </div>

            {/* Sections List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {sections.length > 0 ? (
                    <div className="divide-y divide-gray-800">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors"
                            >
                                <div className="text-gray-600">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                                    <Folder className="w-5 h-5 text-primary-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{section.name}</p>
                                    <p className="text-gray-500 text-sm">
                                        {section._count?.questions || 0} questions
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(section)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteSection(section.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Folder className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">No sections yet</p>
                        <button
                            onClick={openAddModal}
                            className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                            Create your first section
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-lg font-semibold text-white">
                                {editing ? 'Edit Section' : 'Add Section'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="e.g., Quantitative Aptitude"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
