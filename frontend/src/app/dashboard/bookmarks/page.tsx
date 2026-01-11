'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bookmark, BookOpen, Loader2, HelpCircle, Trash2 } from 'lucide-react';

interface BookmarkData {
    id: string;
    createdAt: string;
    question: {
        id: string;
        questionText: string;
        difficulty: string;
        subject: { name: string };
        topic: { name: string } | null;
    };
}

export default function BookmarksPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadBookmarks();
        }
    }, [user, authLoading]);

    const loadBookmarks = async () => {
        try {
            const res = await api.get<BookmarkData[]>('/questions/user/bookmarks');
            if (res.success && res.data) {
                setBookmarks(res.data);
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeBookmark = async (questionId: string) => {
        try {
            // Toggle bookmark (POST is used for both add and remove)
            const res = await api.post(`/questions/${questionId}/bookmark`);
            if (res.success) {
                setBookmarks(bookmarks.filter(b => b.question.id !== questionId));
            }
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-gray-950 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading bookmarks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bookmarks</h1>
                    <p className="text-gray-600 dark:text-gray-400">Your saved questions for review ({bookmarks.length} saved).</p>
                </div>

                {bookmarks.length > 0 ? (
                    <div className="space-y-4">
                        {bookmarks.map((bookmark, i) => (
                            <div
                                key={bookmark.id}
                                className="card p-5 animate-slide-up"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <HelpCircle className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className="text-gray-900 dark:text-white mb-2 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: bookmark.question.questionText }}
                                            />
                                            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-medium">
                                                    {bookmark.question.subject?.name || 'General'}
                                                </span>
                                                {bookmark.question.topic && (
                                                    <span className="text-gray-400">
                                                        {bookmark.question.topic.name}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${bookmark.question.difficulty === 'EASY'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : bookmark.question.difficulty === 'MEDIUM'
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {bookmark.question.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeBookmark(bookmark.question.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove bookmark"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card p-10 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bookmark className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Bookmarks Yet</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            You haven't bookmarked any questions. Review your test attempts or practice questions to find important topics.
                        </p>
                        <Link href="/questions" className="btn btn-primary">
                            Practice Questions
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
