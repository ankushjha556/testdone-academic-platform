'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Search,
    Users,
    Mail,
    Shield,
    MoreVertical,
    ChevronDown,
    Loader2,
    Calendar,
    Trash2,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
    _count?: { attempts: number };
}

const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/20 text-red-400',
    ADMIN: 'bg-purple-500/20 text-purple-400',
    CONTENT_MANAGER: 'bg-blue-500/20 text-blue-400',
    PREMIUM_USER: 'bg-amber-500/20 text-amber-400',
    FREE_USER: 'bg-gray-500/20 text-gray-400',
};

export default function UsersListPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [updatingRole, setUpdatingRole] = useState(false);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    useEffect(() => {
        loadUsers();
    }, [roleFilter]);

    const loadUsers = async (page = 1) => {
        setLoading(true);
        try {
            let url = `/admin/users?page=${page}&limit=20`;
            if (roleFilter !== 'all') url += `&role=${roleFilter}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await api.get<{ users: User[]; pagination: any }>(url);
            if (res.success && res.data?.users) {
                setUsers(res.data.users);
                setPagination(res.data.pagination || { currentPage: 1, totalPages: 1 });
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        setUpdatingRole(true);
        try {
            const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            if (res.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        } finally {
            setUpdatingRole(false);
            setEditingRole(null);
        }
    };

    const handleSearch = () => {
        loadUsers(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="text-gray-400">Manage user accounts and roles</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CONTENT_MANAGER">Content Manager</option>
                    <option value="PREMIUM_USER">Premium User</option>
                    <option value="FREE_USER">Free User</option>
                </select>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                    Search
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden md:table-cell">Email</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Joined</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Role</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {user.firstName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-gray-500 text-sm md:hidden">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">{user.email}</span>
                                        {user.isEmailVerified && (
                                            <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>

                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setEditingRole(editingRole === user.id ? null : user.id)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.FREE_USER}`}
                                        >
                                            <Shield className="w-3 h-3" />
                                            {user.role.replace('_', ' ')}
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                        {editingRole === user.id && (
                                            <div className="absolute left-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                                {Object.keys(roleColors).map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => updateRole(user.id, role)}
                                                        disabled={updatingRole}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700 text-sm"
                                                    >
                                                        {updatingRole && user.role !== role && <Loader2 className="w-4 h-4 animate-spin" />}
                                                        {role.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to delete this user?')) {
                                                try {
                                                    const res = await api.delete(`/admin/users/${user.id}`);
                                                    if (res.success) {
                                                        setUsers(users.filter(u => u.id !== user.id));
                                                    }
                                                } catch (err) {
                                                    alert('Failed to delete user');
                                                }
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {
                    users.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No users found</p>
                        </div>
                    )
                }
            </div >

            {/* Pagination */}
            {
                pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => loadUsers(page)}
                                className={`px-3 py-1.5 rounded ${page === pagination.currentPage
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )
            }
        </div >
    );
}
