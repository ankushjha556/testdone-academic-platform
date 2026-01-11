'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Save,
    Upload,
    Loader2,
    Image as ImageIcon,
    X,
} from 'lucide-react';

interface ExamCategory {
    id: string;
    name: string;
}

export default function NewExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<ExamCategory[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        fullName: '',
        description: '',
        eligibility: '',
        conductingBody: '',
        frequency: '',
        vacancies: '',
        salaryRange: '',
        iconUrl: '',
        isFeatured: false,
        status: 'DRAFT',
        categoryId: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get<{ categories: ExamCategory[] }>('/exams/categories');
            // Backend returns { success, data: { categories: [...] } }
            if (res.success && res.data) {
                const data = res.data as any;
                const categories = data.categories || [];
                setCategories(categories);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'testdone/exams');

            const res = await api.upload<{ url: string }>('/upload/image', formDataUpload);
            const data = res.data as { url?: string } | undefined;
            if (res.success && data?.url) {
                setFormData(prev => ({ ...prev, iconUrl: data.url! }));
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await api.post('/admin/exams', formData);
            if (res.success) {
                alert('Exam created successfully!');
                router.push('/admin/exams');
            } else {
                alert('Failed to create exam: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save exam');
        } finally {
            setSaving(false);
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
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/exams"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create New Exam</h1>
                    <p className="text-gray-400">Add a new exam to the platform</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        placeholder="e.g., Staff Selection Commission - Combined Graduate Level"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Exam Details</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Conducting Body</label>
                                    <input
                                        type="text"
                                        value={formData.conductingBody}
                                        onChange={(e) => setFormData({ ...formData, conductingBody: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                                    <input
                                        type="text"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        placeholder="e.g., Yearly, Twice a year"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Vacancies</label>
                                    <input
                                        type="text"
                                        value={formData.vacancies}
                                        onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Salary Range</label>
                                    <input
                                        type="text"
                                        value={formData.salaryRange}
                                        onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Eligibility</label>
                                    <textarea
                                        value={formData.eligibility}
                                        onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Publish</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-gray-300">Featured Exam</span>
                                </label>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Icon/Image</h2>
                            <div className="space-y-4">
                                {formData.iconUrl ? (
                                    <div className="relative">
                                        <img
                                            src={formData.iconUrl}
                                            alt="Exam icon"
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, iconUrl: '' })}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                                                <span className="text-sm text-gray-500">Upload Image</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Create Exam
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
