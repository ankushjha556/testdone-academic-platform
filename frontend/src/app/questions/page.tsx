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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* SEO Content: Public Hub */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold font-heading text-gray-900 dark:text-white mb-6">
                        Competitive Exam Question Bank
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                        Welcome to India&apos;s most comprehensive Question Bank for government exams.
                        Access over <strong>1 Lakh+ practice questions</strong> covering Quantitative Aptitude,
                        Reasoning, English, and General Awareness for SSC, Banking, and Railway exams.
                    </p>

                    {/* Quick Access Grid (Internal Links) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">SSC Exams</h2>
                            <ul className="text-sm space-y-1 text-gray-500">
                                <li><Link href="/exams/ssc-cgl" className="hover:text-primary-600">SSC CGL Questions</Link></li>
                                <li><Link href="/exams/ssc-chsl" className="hover:text-primary-600">SSC CHSL Questions</Link></li>
                                <li><Link href="/exams/ssc-mts" className="hover:text-primary-600">SSC MTS Q-Bank</Link></li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Banking</h2>
                            <ul className="text-sm space-y-1 text-gray-500">
                                <li><Link href="/exams/ibps-po" className="hover:text-primary-600">IBPS PO Questions</Link></li>
                                <li><Link href="/exams/sbi-clerk" className="hover:text-primary-600">SBI Clerk Practice</Link></li>
                                <li><Link href="/exams/rbi-assistant" className="hover:text-primary-600">RBI Assistant PQ</Link></li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Railways</h2>
                            <ul className="text-sm space-y-1 text-gray-500">
                                <li><Link href="/exams/rrb-ntpc" className="hover:text-primary-600">RRB NTPC Questions</Link></li>
                                <li><Link href="/exams/rrb-group-d" className="hover:text-primary-600">RRB Group D</Link></li>
                                <li><Link href="/exams/rrb-alp" className="hover:text-primary-600">RRB ALP Practice</Link></li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Subjects</h2>
                            <ul className="text-sm space-y-1 text-gray-500">
                                <li><span className="cursor-pointer hover:text-primary-600">Quantitative Aptitude</span></li>
                                <li><span className="cursor-pointer hover:text-primary-600">Logical Reasoning</span></li>
                                <li><span className="cursor-pointer hover:text-primary-600">English Language</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Interactive Client Component */}
                <QuestionsClient />
            </div>
        </div>
    );
}
