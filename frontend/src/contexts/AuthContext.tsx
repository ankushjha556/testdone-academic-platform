'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    role: string;
    subscriptionStatus: 'free' | 'premium';
}

interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (token: string) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await api.get('/auth/me');
            if (response.success) {
                setUser(response.data as User);
            }
        } catch (error) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });

        if (response.success) {
            const data = response.data as LoginResponse;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
            if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } else {
            throw new Error(response.error?.message || 'Login failed');
        }
    };

    const loginWithGoogle = async (token: string) => {
        const response = await api.post('/auth/google', { token });

        if (response.success) {
            const data = response.data as LoginResponse;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
            if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } else {
            throw new Error(response.error?.message || 'Google Login failed');
        }
    };

    const signup = async (data: SignupData) => {
        const response = await api.post('/auth/signup', data);

        if (response.success) {
            const data = response.data as LoginResponse;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
            if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } else {
            throw new Error(response.error?.message || 'Signup failed');
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await api.post('/auth/logout', { refreshToken });
        } catch (error) {
            // Ignore errors
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            router.push('/');
        }
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                loginWithGoogle,
                signup,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
