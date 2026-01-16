'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Lock, AlertTriangle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useEffect } from 'react';

interface TestDetailContentProps {
    test: any;
}

export default function TestDetailContent({ test }: TestDetailContentProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // Auth Check
    useEffect(() => {
        if (!authLoading && !isAuthenticated && test.accessType === 'PREMIUM') {
            // Optional: Redirect if premium and not logged in, but we might want to show the sales page?
            // For now, preserving behavior: keep them here, show Lock.
        }
    }, [authLoading, isAuthenticated, test.accessType]);


    const handleStart = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/tests/${test.slug}`);
            return;
        }
        router.push(`/tests/${test.slug}/attempt`);
    };

    return (
        <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white relative">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium mb-4">
                                <span>{test.exam.name}</span>
                                <span>•</span>
                                <span>{test.testType}</span>
                            </div>
                            <h1 className="text-3xl font-bold font-heading mb-4">{test.name}</h1>
                            <div className="flex flex-wrap gap-6 text-white/90">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    {test.totalQuestions} Questions
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    {test.durationMinutes} Minutes
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    {test.totalMarks} Marks
                                </span>
                            </div>
                        </div>
                        {/* Bg Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Instructions
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="mb-2">Please read the following instructions carefully:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    {test.instructions ? (
                                        // If instructions are HTML or text
                                        <div dangerouslySetInnerHTML={{ __html: test.instructions }} />
                                    ) : (
                                        <>
                                            <li>The test contains {test.totalQuestions} questions of {test.totalMarks} marks.</li>
                                            <li>Total duration of the test is {test.durationMinutes} minutes.</li>
                                            <li>There is {Number(test.negativeMarking) > 0 ? `${test.negativeMarking} marks` : 'no'} negative marking for wrong answers.</li>
                                            <li>The clock will be set at the server. The countdown timer at the top right-hand side of the screen will display the time remaining.</li>
                                            <li>Click on 'Submit Test' anytime to finish the test. The test will automatically submit when the timer reaches zero.</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </section>

                        {/* Sections info if available */}
                        {test.sections && (
                            <section className="mb-8">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sections in this test:</h3>
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {test.sections.map((sec: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm border border-gray-100 dark:border-gray-600">
                                            <span className="font-medium block mb-1">{sec.name}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{sec.questions} Qs • {sec.marks} Marks</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-8 mt-8">
                            <div className="text-sm text-gray-500">
                                {test.attemptsCount} students have taken this test
                            </div>

                            {test.accessType === 'PREMIUM' &&
                                user?.subscriptionStatus !== 'premium' &&
                                !['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') ? (
                                <button className="btn btn-disabled w-full sm:w-auto bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Unlock with Premium
                                </button>
                            ) : (
                                <button
                                    onClick={handleStart}
                                    className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
