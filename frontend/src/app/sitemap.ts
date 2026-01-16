import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://testdone.in';
// Use localhost for server-side fetching to avoid loopback issues
const API_URL = 'http://127.0.0.1:5000/api/v1';

async function getExams() {
    try {
        const res = await fetch(`${API_URL}/exams`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.success && Array.isArray(data.data)) ? data.data : [];
    } catch (error) {
        console.error('Failed to fetch exams for sitemap', error);
        return [];
    }
}

async function getTests() {
    try {
        // Fetch public mock tests
        const res = await fetch(`${API_URL}/tests?limit=100`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.success && data.data && Array.isArray(data.data.tests)) ? data.data.tests : [];
    } catch (error) {
        console.error('Failed to fetch tests for sitemap', error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const exams = await getExams();
    const tests = await getTests();

    const routes = [
        '',
        '/about',
        '/contact',
        '/pricing',
        // '/terms',
        // '/privacy',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    const examRoutes = exams.map((exam: any) => ({
        url: `${BASE_URL}/exams/${exam.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    const testRoutes = tests.map((test: any) => ({
        url: `${BASE_URL}/tests/${test.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...routes, ...examRoutes, ...testRoutes];
}
