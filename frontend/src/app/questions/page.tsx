import { Metadata } from 'next';
import Link from 'next/link';
import QuestionsClient from './QuestionsClient';

export const metadata: Metadata = {
    title: 'Competitive Exam Question Bank | SSC, Banking, RRB | TestDone',
    description: 'Practice 1 Lakh+ questions for SSC CGL, IBPS PO, RRB NTPC. Free question bank with detailed solutions, difficulty filters, and previous year papers.',
    keywords: ['Question Bank', 'SSC Questions', 'Banking Question Bank', 'Competitive Exam Questions', 'RRB NTPC Questions', 'General Awareness Questions'],
    alternates: {
        canonical: 'https://testdone.in/questions'
    }
};

export default function QuestionsPage() {
    return (
        <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* SEO Content: Public Hub */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold font-heading text-gray-900 dark:text-white mb-6">
                        Subject-Wise Question Bank
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-4">
                        Practice <strong>1.5 Lakh+ questions</strong> organized by subject. Master core subjects common to SSC, Banking, Railways, Defence, Insurance, and all government competitive exams.
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-5 py-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="mb-2">
                            <strong className="text-gray-800 dark:text-gray-200">📚 About This Question Bank</strong>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            This question bank is curated from Previous Year Questions (PYQs) and trusted exam-oriented sources. Questions here cover <em>all major subjects</em> tested across SSC CGL, CHSL, MTS, IBPS PO/Clerk, RRB NTPC, Group D, and more. Practice subject-wise to build confidence and identify weak areas.
                        </p>
                    </div>

                    {/* Subject-Based Quick Access Grid - All 7 Canonical Subjects */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 text-left">
                        <Link href="/questions?subject=quantitative-aptitude" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">📐</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">Quantitative Aptitude</h2>
                            <p className="text-xs text-gray-500">Arithmetic, Algebra, Geometry & more</p>
                        </Link>
                        <Link href="/questions?subject=reasoning-ability" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">🧠</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">Reasoning Ability</h2>
                            <p className="text-xs text-gray-500">Verbal, Non-Verbal & Logical</p>
                        </Link>
                        <Link href="/questions?subject=english-language" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">📖</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">English Language</h2>
                            <p className="text-xs text-gray-500">Grammar, Vocabulary & Comprehension</p>
                        </Link>
                        <Link href="/questions?subject=general-awareness" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">🌍</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">General Awareness</h2>
                            <p className="text-xs text-gray-500">Static GK, History, Geography & Polity</p>
                        </Link>
                        <Link href="/questions?subject=computer-awareness" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">💻</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">Computer Awareness</h2>
                            <p className="text-xs text-gray-500">Fundamentals, MS Office & Networking</p>
                        </Link>
                        <Link href="/questions?subject=data-interpretation" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">📊</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">Data Interpretation</h2>
                            <p className="text-xs text-gray-500">Tables, Charts, Graphs & Caselets</p>
                        </Link>
                        <Link href="/questions?subject=current-affairs" className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl">📰</span>
                            </div>
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">Current Affairs</h2>
                            <p className="text-xs text-gray-500">National, International & Economy</p>
                        </Link>
                    </div>
                </div>

                {/* Interactive Client Component */}
                <QuestionsClient />
            </div>
        </div>
    );
}
