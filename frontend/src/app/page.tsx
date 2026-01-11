'use client';

import Link from 'next/link';
import {
    BookOpen,
    Users,
    Trophy,
    Clock,
    ChevronRight,
    Sparkles,
    Target,
    TrendingUp,
    Shield,
    Zap,
    CheckCircle2,
    ArrowRight,
    Star,
    LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Featured exams data
const featuredExams = [
    { name: 'IBPS PO', slug: 'ibps-po', color: '#3B82F6', tests: 250, users: '5 Lakh+' },
    { name: 'SBI PO', slug: 'sbi-po', color: '#2563EB', tests: 200, users: '4 Lakh+' },
    { name: 'SSC CGL', slug: 'ssc-cgl', color: '#10B981', tests: 300, users: '6 Lakh+' },
    { name: 'RRB NTPC', slug: 'rrb-ntpc', color: '#F59E0B', tests: 180, users: '3 Lakh+' },
    { name: 'IBPS Clerk', slug: 'ibps-clerk', color: '#0EA5E9', tests: 220, users: '4.5 Lakh+' },
    { name: 'SSC CHSL', slug: 'ssc-chsl', color: '#059669', tests: 150, users: '2.5 Lakh+' },
];

const features = [
    { icon: BookOpen, title: '1 Lakh+ Questions', desc: 'Comprehensive question bank with solutions' },
    { icon: Clock, title: '5000+ Mock Tests', desc: 'Full-length and sectional tests' },
    { icon: Trophy, title: 'All-India Ranking', desc: 'Compare with lakhs of students' },
    { icon: TrendingUp, title: 'Detailed Analytics', desc: 'Track your progress and improve' },
];

const stats = [
    { value: '25 Lakh+', label: 'Students' },
    { value: '5000+', label: 'Mock Tests' },
    { value: '1 Lakh+', label: 'Questions' },
    { value: '250+', label: 'Exams Covered' },
];

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-orange/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left content */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-accent-amber" />
                                <span>Trusted by 25 Lakh+ Students</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight mb-6">
                                Crack Your Dream Exam with{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-accent-orange">
                                    TestDone
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
                                India's #1 platform for Banking, SSC, Railway & Government exam preparation.
                                Practice with 5000+ mock tests and 1 lakh+ questions.
                            </p>

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

                            {/* Trust indicators */}
                            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-amber to-accent-orange border-2 border-white flex items-center justify-center text-sm font-bold"
                                        >
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <div className="flex text-accent-amber">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-white/80">4.8/5 from 50K+ reviews</span>
                                </div>
                            </div>
                        </div>

                        {/* Right visual */}
                        <div className="hidden lg:block relative">
                            <div className="relative w-full h-[500px]">
                                {/* Floating cards */}
                                <div className="absolute top-0 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 animate-slide-up">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-semibold text-sm">IBPS PO 2024</p>
                                            <p className="text-gray-500 text-xs">Result: Selected!</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full w-[92%] bg-gradient-to-r from-green-400 to-green-600 rounded-full" />
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">Score: 92/100</p>
                                </div>

                                <div className="absolute bottom-20 left-0 w-56 bg-white rounded-2xl shadow-2xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                    <p className="text-gray-900 font-semibold text-sm mb-2">Today's Practice</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Questions</span>
                                        <span className="text-primary-600 font-semibold">127</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Accuracy</span>
                                        <span className="text-green-600 font-semibold">84%</span>
                                    </div>
                                </div>

                                <div className="absolute top-1/2 left-1/4 w-48 bg-gradient-to-br from-accent-orange to-accent-coral text-white rounded-2xl shadow-2xl p-4 -translate-y-1/2">
                                    <Trophy className="w-8 h-8 mb-2" />
                                    <p className="font-semibold">All-India Rank</p>
                                    <p className="text-3xl font-bold">#247</p>
                                    <p className="text-white/80 text-sm">out of 45,280</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 100V50C240 16.67 480 0 720 0C960 0 1200 16.67 1440 50V100H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-gray-50 dark:bg-gray-950 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{stat.value}</p>
                                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Exams */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                            Popular Exams
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Start preparing for India's top competitive exams with our comprehensive study materials
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredExams.map((exam) => (
                            <Link
                                key={exam.slug}
                                href={`/exams/${exam.slug}`}
                                className="card p-6 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                        style={{ backgroundColor: exam.color }}
                                    >
                                        {exam.name.charAt(0)}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {exam.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        {exam.tests} Tests
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {exam.users}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/exams" className="btn btn-outline">
                            View All 250+ Exams
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                            Why Students Love TestDone
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Everything you need to crack your competitive exam in one platform
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="card p-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                                    <feature.icon className="w-7 h-7 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 lg:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-orange/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
                                Ready to Start Your Preparation?
                            </h2>
                            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                                Join 25 lakh+ students who are already preparing with TestDone.
                                Start your journey today – it's completely free!
                            </p>
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
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
