import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import TestDetailContent from '@/components/test/TestDetailContent';

async function getTestData(slug: string) {
    try {
        // Use the public /info/ endpoint for server-side fetching (no auth required)
        const res = await fetch(`http://127.0.0.1:5000/api/v1/tests/info/${slug}`, { next: { revalidate: 3600 } });
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: { testId: string } }): Promise<Metadata> {
    const test = await getTestData(params.testId);

    if (!test) {
        return {
            title: 'Test Not Found',
            description: 'The requested test could not be found.',
            robots: { index: false, follow: false },
        };
    }

    // Auth-protected (non-FREE) tests: noindex
    if (test.accessType !== 'FREE') {
        return {
            title: `${test.name} - TestDone`,
            robots: { index: false, follow: false },
        };
    }

    // Public (FREE) tests: full SEO metadata
    const canonicalUrl = `https://testdone.in/tests/${params.testId}`;

    return {
        title: `${test.name} – Free Online Mock Test | TestDone`,
        description: `Attempt ${test.name} online with real exam interface. Get detailed solutions, performance analytics, and improve your score with TestDone.`,
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

export default async function TestDetailsPage({ params }: { params: { testId: string } }) {
    const test = await getTestData(params.testId);

    if (!test) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">Test not found</p>
                    <Link href="/tests" className="btn btn-secondary">
                        Browse All Tests
                    </Link>
                </div>
            </div>
        );
    }

    const breadcrumbs = [
        { name: 'Home', item: '/' },
        { name: 'Tests', item: '/tests' },
        { name: test.name, item: `/tests/${params.testId}` },
    ];

    return (
        <>
            <BreadcrumbJsonLd items={breadcrumbs} />
            <TestDetailContent test={test} />
        </>
    );
}
