'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    HelpCircle,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Plus,
    Upload,
    Folder,
    ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    {
        name: 'Exams',
        href: '/admin/exams',
        icon: BookOpen,
        children: [
            { name: 'All Exams', href: '/admin/exams' },
            { name: 'Add New', href: '/admin/exams/new' },
            { name: 'Categories', href: '/admin/exams/categories' },
        ]
    },
    {
        name: 'Mock Tests',
        href: '/admin/tests',
        icon: FileText,
        children: [
            { name: 'All Tests', href: '/admin/tests' },
            { name: 'Add New', href: '/admin/tests/new' },
        ]
    },
    {
        name: 'Questions',
        href: '/admin/questions',
        icon: HelpCircle,
        children: [
            { name: 'All Questions', href: '/admin/questions' },
            { name: 'Add New', href: '/admin/questions/new' },
            { name: 'Sections', href: '/admin/questions/sections' },
        ]
    },
    {
        name: 'Books & PDFs',
        href: '/admin/books',
        icon: Folder,
        children: [
            { name: 'All Books', href: '/admin/books' },
            { name: 'Upload New', href: '/admin/books/new' },
        ]
    },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, isLoading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role))) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const toggleMenu = (name: string) => {
        setExpandedMenus(prev =>
            prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <div>
                            <span className="text-white font-bold">TestDone</span>
                            <span className="text-gray-400 text-xs block">Admin Panel</span>
                        </div>
                    </Link>
                    <button
                        className="lg:hidden p-2 text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
                    {menuItems.map((item) => (
                        <div key={item.name}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${pathname.startsWith(item.href)
                                            ? 'bg-primary-600/20 text-primary-400'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.name) ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedMenus.includes(item.name) && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === child.href
                                                        ? 'text-primary-400 bg-primary-600/10'
                                                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                                        }`}
                                                >
                                                    <ChevronRight className="w-3 h-3" />
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === item.href
                                        ? 'bg-primary-600/20 text-primary-400'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.firstName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user.firstName}</p>
                            <p className="text-gray-500 text-xs truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <button
                        className="lg:hidden p-2 text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1 lg:flex-none" />

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            target="_blank"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            View Site →
                        </Link>
                        <Link
                            href="/admin/exams/new"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Content
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
