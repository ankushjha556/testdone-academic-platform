'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2, ChevronDown } from 'lucide-react';

interface Section {
    id: string;
    name: string;
    slug: string;
    description?: string;
    order: number;
    examId: string;
    exam?: { name: string };
    _count?: { questions: number };
}

interface Exam {
    id: string;
    name: string;
}

export default function SectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', order: 0, examId: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            loadSections(selectedExam);
        }
    }, [selectedExam]);

    const loadExams = async () => {
        try {
            const res = await api.get<{ exams: Exam[] }>('/admin/exams');
            if (res.success && res.data?.exams) {
                setExams(res.data.exams);
                if (res.data.exams.length > 0) {
                    setSelectedExam(res.data.exams[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSections = async (examId: string) => {
        try {
            const res = await api.get<{ sections: Section[] }>(`/admin/exams/${examId}/sections`);
            if (res.success && res.data?.sections) {
                setSections(res.data.sections);
            }
        } catch (error) {
            console.error('Failed to load sections:', error);
            setSections([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExam) {
            alert('Please select an exam first');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, examId: selectedExam };
            if (editingId) {
                await api.put(`/admin/sections/${editingId}`, payload);
            } else {
                await api.post(`/admin/exams/${selectedExam}/sections`, payload);
            }
            loadSections(selectedExam);
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', description: '', order: 0, examId: '' });
        } catch (error) {
            console.error('Failed to save section:', error);
            alert('Failed to save section');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (sec: Section) => {
        setFormData({ name: sec.name, description: sec.description || '', order: sec.order, examId: sec.examId });
        setEditingId(sec.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return;
        try {
            await api.delete(`/admin/sections/${id}`);
            loadSections(selectedExam);
        } catch (error) {
            alert('Failed to delete section');
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Exam Sections</h1>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', order: 0, examId: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    disabled={!selectedExam}
                >
                    <Plus className="w-5 h-5" />
                    Add Section
                </button>
            </div>

            <div className="flex items-center gap-4">
                <label className="text-gray-300">Select Exam:</label>
                <select
                    value={selectedExam}
                    onChange={e => setSelectedExam(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white min-w-[250px]"
                >
                    <option value="">Select an exam</option>
                    {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                </select>
            </div>

            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Section' : 'Add New Section'}</h2>
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
                            <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                                {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Questions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sections.map(sec => (
                            <tr key={sec.id} className="hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-white font-medium">{sec.name}</td>
                                <td className="px-6 py-4 text-gray-400">{sec.description || '-'}</td>
                                <td className="px-6 py-4 text-gray-400">{sec._count?.questions || 0}</td>
                                <td className="px-6 py-4 text-gray-400">{sec.order}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(sec)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(sec.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sections.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                {selectedExam ? 'No sections found for this exam' : 'Select an exam to view sections'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
