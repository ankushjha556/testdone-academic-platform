'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Download,
    MoreVertical,
    BookOpen,
    Eye,
    EyeOff,
    Check,
    Loader2,
    FileText,
} from 'lucide-react';

interface Book {
    id: string;
    title: string;
    author?: string;
    description?: string;
    coverUrl?: string;
    pdfUrl?: string;
    pages?: number;
    category?: string;
    accessType: string;
    downloadsCount: number;
    status: string;
    subject?: { name: string };
}

export default function BooksListPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            // Use admin endpoint for admin panel
            const res = await api.get<{ books: Book[] }>('/admin/books');
            // Backend returns { success, data: { books: [...] } }
            if (res.success && res.data) {
                const data = res.data as any;
                setBooks(data.books || []);
            }
        } catch (error) {
            console.error('Failed to load books:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            const res = await api.patch(`/admin/books/${id}`, { status: newStatus });
            if (res.success) {
                setBooks(books.map(b => b.id === id ? { ...b, status: newStatus } : b));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
        setActionMenu(null);
    };

    const deleteBook = async (id: string) => {
        if (!confirm('Delete this book? This cannot be undone.')) return;

        setDeleting(id);
        try {
            const res = await api.delete(`/admin/books/${id}`);
            if (res.success) {
                setBooks(books.filter(b => b.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setDeleting(null);
            setActionMenu(null);
        }
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase())
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
                    <h1 className="text-2xl font-bold text-white">Books & PDFs</h1>
                    <p className="text-gray-400">Manage study materials and resources</p>
                </div>
                <Link
                    href="/admin/books/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Upload Book
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search books..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
            </div>

            {/* Books Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBooks.map((book) => (
                    <div
                        key={book.id}
                        className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
                    >
                        {/* Cover */}
                        <div className="relative h-40 bg-gray-800">
                            {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-12 h-12 text-gray-600" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${book.accessType === 'FREE'
                                    ? 'bg-green-500/90 text-white'
                                    : 'bg-amber-500/90 text-white'
                                    }`}>
                                    {book.accessType}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="text-white font-semibold mb-1 truncate">{book.title}</h3>
                            <p className="text-gray-500 text-sm mb-3">{book.author || 'Unknown author'}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Download className="w-4 h-4" />
                                    {book.downloadsCount}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={`/admin/books/${book.id}/edit`}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenu(actionMenu === book.id ? null : book.id)}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {actionMenu === book.id && (
                                            <div className="absolute right-0 bottom-full mb-1 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                                <button
                                                    onClick={() => toggleStatus(book.id, book.status)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                                >
                                                    {book.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    {book.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                                </button>
                                                <button
                                                    onClick={() => deleteBook(book.id)}
                                                    disabled={deleting === book.id}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                                                >
                                                    {deleting === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBooks.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No books found</p>
                    <Link href="/admin/books/new" className="text-primary-400 hover:text-primary-300 text-sm">
                        Upload your first book
                    </Link>
                </div>
            )}
        </div>
    );
}
