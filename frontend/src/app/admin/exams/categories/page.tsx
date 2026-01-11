'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    order: number;
    isActive: boolean;
    _count?: { exams: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon: '', color: '#3B82F6', order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get<{ categories: Category[] }>('/admin/categories');
            if (res.success && res.data?.categories) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const payload = { ...formData, slug };

            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, payload);
            } else {
                await api.post('/admin/categories', payload);
            }
            loadCategories();
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', slug: '', icon: '', color: '#3B82F6', order: 0 });
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon || '', color: cat.color || '#3B82F6', order: cat.order });
        setEditingId(cat.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            loadCategories();
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Exam Categories</h1>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', slug: '', icon: '', color: '#3B82F6', order: 0 }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                            <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="auto-generated if empty" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Icon (Lucide name)</label>
                            <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="e.g., Landmark" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                            <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
                            <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exams</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-gray-800/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color || '#3B82F6' }}>
                                            <span className="text-white text-sm font-bold">{cat.name[0]}</span>
                                        </div>
                                        <span className="text-white font-medium">{cat.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">{cat.slug}</td>
                                <td className="px-6 py-4 text-gray-400">{cat._count?.exams || 0}</td>
                                <td className="px-6 py-4 text-gray-400">{cat.order}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(cat)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No categories found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
