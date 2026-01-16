import Link from 'next/link';
import { Metadata } from 'next';
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
import { ActionButtons, CTAButtons } from '@/components/home/ActionButtons';

export const metadata: Metadata = {
    title: "TestDone – Smart Competitive Exam Preparation Platform | Mock Tests & PYQs",
    description: "Prepare for SSC, Banking, Railways, and 250+ government exams with TestDone. Get free mock tests, previous year questions, and performance analytics.",
};

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

import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import WebsiteJsonLd from '@/components/seo/WebsiteJsonLd';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <OrganizationJsonLd />
            <WebsiteJsonLd />
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

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight mb-4">
                                India&apos;s Smart Competitive Exam Preparation Platform
                            </h1>
                            <p className="text-xl sm:text-2xl font-medium text-accent-amber mb-6">
                                Crack Your Dream Exam with TestDone
                            </p>

                            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
                                India&apos;s #1 platform for Banking, SSC, Railway & Government exam preparation.
                                Practice with 5000+ mock tests and 1 lakh+ questions.
                            </p>

                            <ActionButtons />

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
                                    <p className="text-gray-900 font-semibold text-sm mb-2">Today&apos;s Practice</p>
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
                            Start preparing for India&apos;s top competitive exams with our comprehensive study materials
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

            {/* SEO Content Block: Why Choose TestDone */}
            <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-6">
                                Why Choose TestDone for Your Exam Prep?
                            </h2>
                            <div className="prose dark:prose-invert max-w-none space-y-4 text-gray-600 dark:text-gray-400">
                                <p>
                                    TestDone is India&apos;s most trusted competitive exam preparation platform, designed to help you crack exams like <strong>SSC CGL, IBPS PO, SBI Clerk, RRB NTPC, and UPSC</strong>. We provide a scientifically designed testing interface that matches the real exam environment.
                                </p>
                                <p>
                                    Our extensive <strong>Question Bank</strong> contains over 1 lakh+ updated questions covering Quantitative Aptitude, Reasoning, English, and General Awareness. With our <strong>Free Mock Tests</strong> and <strong>Previous Year Question Papers (PYQs)</strong>, you can analyze your performance with detailed solutions and all-India rankings.
                                </p>
                                <p>
                                    Whether you are a beginner or an advanced aspirant, TestDone&apos;s personalized analytics help you identify weak areas and improve your speed and accuracy. Join thousands of successful candidates who have cleared their government exams with TestDone.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                                <h4 className="font-semibold text-primary-600 mb-2">Real Exam Interface</h4>
                                <p className="text-sm text-gray-500">Practice on the exact same UI used in actual TCS/NTA exams.</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                                <h4 className="font-semibold text-primary-600 mb-2">Detailed Solutions</h4>
                                <p className="text-sm text-gray-500">Step-by-step explanations and shortcut tricks for every question.</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                                <h4 className="font-semibold text-primary-600 mb-2">All India Rank</h4>
                                <p className="text-sm text-gray-500">Compete with lakhs of students and check your standing.</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                                <h4 className="font-semibold text-primary-600 mb-2">Latest Pattern</h4>
                                <p className="text-sm text-gray-500">Questions updated daily as per the latest 2024-2025 syllabus.</p>
                            </div>
                        </div>
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
                                Start your journey today – it&apos;s completely free!
                            </p>
                            <CTAButtons />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
