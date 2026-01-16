const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? 'http://localhost:5000/api/v1' : 'https://testdone.in/api/v1');

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();
        if (data.success && data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            return data.data.accessToken;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    return null;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    if (!endpoint) {
        console.error('API Error: Endpoint is undefined', new Error().stack);
        throw new Error('API request failed: Endpoint is undefined');
    }
    console.log(`[API Debug] API_URL: ${API_URL}, Endpoint: ${endpoint}`);
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        let response = await fetch(url, { ...options, headers });

        // Handle token expiration
        if (response.status === 401 && accessToken) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            error: { message: 'Network error. Please try again.' },
        };
    }
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, body?: any) =>
        request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T>(endpoint: string, body?: any) =>
        request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    patch: <T>(endpoint: string, body?: any) =>
        request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

    // File upload with FormData (for images/PDFs)
    upload: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
        const url = `${API_URL}${endpoint}`;
        const accessToken = localStorage.getItem('accessToken');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
                body: formData,
            });
            return await response.json();
        } catch (error) {
            console.error('Upload failed:', error);
            return {
                success: false,
                error: { message: 'Upload failed. Please try again.' },
            };
        }
    },
};
