'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, Lock, Mail, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user, isLoading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
            });
        }
    }, [user, authLoading]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/users/profile', formData);
            if (res.success) {
                await refreshUser();
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save: ' + (res.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your profile and preferences.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Profile Card */}
                    <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <User className="w-5 h-5 text-primary-600" />
                            Profile Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="input w-full"
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="input w-full"
                                    placeholder="Enter your last name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="input pl-10 w-full bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Lock className="w-5 h-5 text-primary-600" />
                            Security
                        </h2>

                        <div className="space-y-4">
                            <button className="w-full btn btn-outline justify-center">
                                Change Password
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Keep your account secure by using a strong password.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
