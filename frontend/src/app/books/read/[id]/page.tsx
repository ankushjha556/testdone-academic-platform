'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Book {
    id: string;
    title: string;
    pdfUrl: string;
}

export default function BookReaderPage() {
    const params = useParams();
    const router = useRouter();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) {
            loadBook(params.id as string);
        }
    }, [params.id]);

    const loadBook = async (id: string) => {
        try {
            // Re-use admin endpoint or public endpoint if available
            // Assuming public endpoint /books/:id exists or we use /books and find
            // Better: /books/:id/download usually returns URL, but we need metadata too.
            // Let's try /books/{id} from public API if it exists.

            // Checking admin routes, GET /admin/books/:id exists. 
            // Checking public routes? Not visible to agent. 
            // But BooksPage uses /books. 
            // Let's try to find the book from the /books list or fetching specific.
            // Assuming GET /api/v1/books/:id exists.

            const res = await api.get<{ book: Book }>(`/books/${id}`);
            // If public route doesn't exist, we might fail. 
            // But usually detail routes exist. If not, I should have checked.

            if (res.success && res.data) {
                // api.ts returns "data" as T. Backend returns {success, data: {book}}
                // So res.data might be { book: ... }
                const data = res.data as any;
                setBook(data.book || data);
            } else {
                setError('Book not found');
            }
        } catch (err) {
            console.error('Failed to load book', err);
            setError('Failed to load book');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Error</h1>
                <p className="text-gray-400 mb-6">{error || 'Book not found'}</p>
                <Link href="/books" className="btn btn-primary">
                    Go Back
                </Link>
            </div>
        );
    }

    // Google Docs Viewer URL
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(book.pdfUrl)}&embedded=true`;

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-gray-800 bg-gray-900 text-white">
                <Link href="/books" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-semibold truncate flex-1">{book.title}</h1>
            </header>

            {/* Viewer */}
            <div className="flex-1 bg-gray-800 relative">
                <iframe
                    src={viewerUrl}
                    className="w-full h-full border-none"
                    title={book.title}
                    allowFullScreen
                >
                </iframe>

                {/* Fallback link if iframe has issues */}
                <div className="absolute bottom-4 right-4">
                    <a
                        href={book.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-400 hover:text-white underline bg-black/50 p-2 rounded"
                    >
                        Direct Link
                    </a>
                </div>
            </div>
        </div>
    );
}
