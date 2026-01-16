'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Menu,
    X,
    ChevronDown,
    User,
    LogOut,
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    HelpCircle,
    Settings,
    Crown,
    Sun,
    Moon,
    Shield,
    CreditCard
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const navLinks = [
    { label: 'Exams', href: '/exams' },
    { label: 'Mock Tests', href: '/tests' },
    { label: 'Question Bank', href: '/questions' },
    { label: 'Books & PDFs', href: '/books' },
    { label: 'Pricing', href: '/pricing' },
];

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="TestDone" className="h-10 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle - Always visible */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                            aria-label="Toggle Dark Mode"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {/* Desktop Profile Dropdown - Hidden on mobile */}
                        {isAuthenticated ? (
                            <div className="relative group hidden lg:block">
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <User className="w-4 h-4 text-primary-600" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user?.firstName}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {/* User dropdown - Desktop only */}
                                <div className="absolute right-0 top-full w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Subscription
                                    </Link>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Admin Panel
                                        </Link>
                                    )}
                                    <Link
                                        href="/dashboard/tests"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        My Tests
                                    </Link>
                                    <Link
                                        href="/dashboard/bookmarks"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Bookmarks
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Link>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link href="/signup" className="btn btn-primary btn-sm hidden lg:inline-flex">
                                    Get Started Free
                                </Link>
                            </>
                        )}

                        {/* Mobile menu button (hamburger) */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu - Full navigation + profile */}
                {mobileMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800 animate-fade-in">
                        {/* User profile section at top of mobile menu */}
                        {isAuthenticated && (
                            <div className="px-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                                        ) : (
                                            <span className="text-white font-bold text-lg">{user?.firstName?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Profile Quick Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-sm font-medium text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Crown className="w-4 h-4" />
                                        Subscribe
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <nav className="flex flex-col gap-1 px-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Authenticated user menu items */}
                        {isAuthenticated && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 px-2">
                                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="w-5 h-5 text-primary-600" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/tests"
                                    className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <ClipboardList className="w-5 h-5 text-emerald-600" />
                                    My Tests
                                </Link>
                                <Link
                                    href="/dashboard/bookmarks"
                                    className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Bookmarks
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    Settings
                                </Link>
                                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </div>
                        )}

                        {/* Non-authenticated user - Login/Signup buttons */}
                        {!isAuthenticated && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 px-2 flex flex-col gap-2">
                                <Link
                                    href="/login"
                                    className="w-full text-center py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="w-full text-center py-3 bg-primary-600 text-white rounded-lg font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started Free
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
