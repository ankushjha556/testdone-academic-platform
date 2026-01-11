'use client';

import { useState, useEffect } from 'react';
import { Book, Search, Lock, Unlock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface BookItem {
    id: string;
    title: string;
    author: string;
    description: string;
    coverUrl?: string;
    pages: number;
    sizeMb: number;
    category: string;
    accessType: 'FREE' | 'PREMIUM';
    downloadsCount: number;
    rating?: number;
    subject?: { id: string; name: string; slug: string };
}

export default function BooksPage() {
    const { isAuthenticated } = useAuth();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            const res = await api.get<{ books: BookItem[] }>('/books');
            if (res.success && res.data) {
                setBooks(res.data.books);
            }
        } catch (error) {
            console.error('Failed to load books', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBooks = books.filter(book =>
        (book.title.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase())) &&
        (category ? book.category === category : true)
    );

    const categories = Array.from(new Set(books.map(b => b.category)));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                        Study Materials & E-Books
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Download comprehensive study notes, previous year papers, and premium e-books for your preparation.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search books, authors..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input w-full md:w-48"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {books.length === 0 ? (
                    <div className="text-center py-20">
                        <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No books available yet. Check back later!</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBooks.map((book) => (
                            <div key={book.id} className="card group hover:shadow-xl transition-all duration-300">
                                {/* Visual Cover */}
                                <div className="h-48 bg-gradient-to-br from-primary-600 to-primary-800 relative flex items-center justify-center overflow-hidden rounded-t-xl">
                                    <Book className="w-16 h-16 text-white/20 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform" />
                                    <div className="text-center p-4">
                                        <Book className="w-12 h-12 text-white mx-auto mb-2" />
                                        <h3 className="text-white font-bold line-clamp-2">{book.title}</h3>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        {book.accessType === 'FREE' ? (
                                            <span className="badge bg-green-500 text-white border-none flex items-center gap-1">
                                                <Unlock className="w-3 h-3" /> Free
                                            </span>
                                        ) : (
                                            <span className="badge bg-amber-500 text-white border-none flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Premium
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="text-sm text-gray-500 mb-1">{book.category}</p>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1" title={book.title}>
                                        {book.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 mb-4">By {book.author}</p>

                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                        <span>{book.pages} Pages</span>
                                        <span>{book.sizeMb} MB</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/books/read/${book.id}`}
                                            className="btn btn-primary flex-1 flex items-center justify-center"
                                        >
                                            <Book className="w-4 h-4 mr-2" />
                                            Read
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredBooks.length === 0 && books.length > 0 && (
                    <div className="text-center py-20">
                        <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No books found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
