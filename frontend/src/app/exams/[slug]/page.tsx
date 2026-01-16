import { Metadata } from 'next';
import Link from 'next/link';
import ExamDetailContent from '@/components/exam/ExamDetailContent';

async function getExamData(slug: string) {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/v1/exams/${slug}`, { next: { revalidate: 3600 } });
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (error) {
        return null;
    }
}

async function getExamTests(slug: string) {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/v1/exams/${slug}/tests?limit=10`, { next: { revalidate: 3600 } });
        const data = await res.json();
        return data.success ? data.data.tests : [];
    } catch (error) {
        return [];
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const exam = await getExamData(params.slug);

    if (!exam) {
        return {
            title: 'Exam Not Found',
            description: 'The requested exam could not be found.',
        };
    }

    const canonicalUrl = `https://testdone.in/exams/${params.slug}`;

    return {
        title: `${exam.name} Mock Tests & Practice Questions 2026 | TestDone`,
        description: `Prepare for ${exam.name} with free mock tests, practice questions, and detailed solutions. Access previous year papers and track your progress with TestDone.`,
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

export default async function ExamDetailPage({ params }: { params: { slug: string } }) {
    const exam = await getExamData(params.slug);
    const tests = await getExamTests(params.slug);

    if (!exam) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam Not Found</h1>
                    <Link href="/exams" className="text-primary-600 hover:underline">
                        Browse all exams
                    </Link>
                </div>
            </div>
        );
    }

    const breadcrumbs = [
        { name: 'Home', item: '/' },
        { name: 'Exams', item: '/exams' },
        { name: exam.name, item: `/exams/${params.slug}` },
    ];

    return (
        <>
            <BreadcrumbJsonLd items={breadcrumbs} />
            <ExamDetailContent exam={exam} tests={tests} />
        </>
    );
}
