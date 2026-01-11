import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
    title: 'TestDone - India\'s #1 Exam Preparation Platform',
    description: 'Prepare for IBPS, SSC, Railway, and 250+ competitive exams with TestDone. Free mock tests, question bank, and study materials.',
    keywords: 'IBPS PO, SSC CGL, Bank Exams, Mock Tests, Question Bank, Competitive Exams India',
    openGraph: {
        title: 'TestDone - India\'s #1 Exam Preparation Platform',
        description: 'Prepare for 250+ competitive exams with free mock tests and study materials.',
        type: 'website',
        locale: 'en_IN',
        siteName: 'TestDone',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
                <Providers>
                    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
                        <Header />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1e1e2e',
                                color: '#fff',
                                borderRadius: '12px',
                            },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
