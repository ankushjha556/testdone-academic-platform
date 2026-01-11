'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Save,
    Loader2,
    Upload,
    FileText,
    Image as ImageIcon,
    X,
} from 'lucide-react';

interface DropdownItem {
    id: string;
    name: string;
}

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState<DropdownItem[]>([]);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author: '',
        subjectId: '',
        coverUrl: '',
        pdfUrl: '',
        accessType: 'FREE',
        status: 'DRAFT',
    });

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const res = await api.get<{ subjects: DropdownItem[] }>('/admin/subjects');
            // Backend returns { success: true, data: { subjects: [...] } }
            // After api wrapper: res.data = { subjects: [...] }
            if (res.success && res.data) {
                const data = res.data as any;
                const subjects = data.subjects || [];
                setSubjects(subjects);
            }
        } catch (error) {
            console.error('Failed to load subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'pdf') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'cover') setUploadingCover(true);
        else setUploadingPdf(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', type === 'cover' ? 'testdone/covers' : 'testdone/pdfs');

            const endpoint = type === 'cover' ? '/upload/image' : '/upload/pdf';
            const res = await api.upload<{ url: string }>(endpoint, formDataUpload);

            const data = res.data as { url?: string } | undefined;
            if (res.success && data?.url) {
                setFormData(prev => ({
                    ...prev,
                    [type === 'cover' ? 'coverUrl' : 'pdfUrl']: data.url
                }));
            } else {
                alert(`Failed to upload ${type}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Failed to upload ${type}`);
        } finally {
            if (type === 'cover') setUploadingCover(false);
            else setUploadingPdf(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/admin/books', formData);
            if (res.success) {
                alert('Book uploaded successfully!');
                router.push('/admin/books');
            } else {
                alert('Failed to save book: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save book');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/books" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Upload Book/PDF</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
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
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subject (Optional)</label>
                                <select
                                    value={formData.subjectId}
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">None</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                </select>
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
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Files</h2>
                        <div className="space-y-4">
                            {/* Cover Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                                {formData.coverUrl ? (
                                    <div className="relative">
                                        <img src={formData.coverUrl} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, coverUrl: '' })}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'cover')}
                                            className="hidden"
                                            disabled={uploadingCover}
                                        />
                                        {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : <ImageIcon className="w-6 h-6 text-gray-500" />}
                                        <span className="text-xs text-gray-500 mt-1">Upload Cover</span>
                                    </label>
                                )}
                            </div>

                            {/* PDF File */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">PDF File</label>
                                {formData.pdfUrl ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-red-400" />
                                            <span className="text-gray-300 text-sm truncate max-w-[150px]">PDF Uploaded</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, pdfUrl: '' })}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => handleFileUpload(e, 'pdf')}
                                            className="hidden"
                                            disabled={uploadingPdf}
                                        />
                                        {uploadingPdf ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                        <span className="text-xs text-gray-500 mt-1">Upload PDF</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Book
                    </button>
                </div>
            </form>
        </div>
    );
}
