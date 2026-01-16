'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ActionButtons() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            {isAuthenticated ? (
                <Link
                    href="/dashboard"
                    className="btn bg-white text-primary-700 hover:bg-gray-100 btn-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Go to Dashboard
                </Link>
            ) : (
                <Link
                    href="/signup"
                    className="btn bg-white text-primary-700 hover:bg-gray-100 btn-lg shadow-lg hover:shadow-xl transition-all"
                >
                    Start Free Practice
                    <ArrowRight className="w-5 h-5" />
                </Link>
            )}
            <Link
                href="/exams"
                className="btn btn-outline border-white/30 text-white hover:bg-white/10 btn-lg"
            >
                View All Exams
            </Link>
        </div>
    );
}

export function CTAButtons() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
                <Link
                    href="/dashboard"
                    className="btn bg-white text-primary-700 hover:bg-gray-100 btn-lg flex items-center gap-2"
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Go to Dashboard
                </Link>
            ) : (
                <Link
                    href="/signup"
                    className="btn bg-white text-primary-700 hover:bg-gray-100 btn-lg"
                >
                    Create Free Account
                    <ArrowRight className="w-5 h-5" />
                </Link>
            )}
            <Link
                href="/tests"
                className="btn btn-ghost border border-white/30 text-white hover:bg-white/10 btn-lg"
            >
                Try a Free Mock Test
            </Link>
        </div>
    );
}
