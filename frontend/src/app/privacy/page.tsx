import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen py-16 bg-white dark:bg-gray-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500">Last updated: January 2026</p>

                    <p>
                        TestDone ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access our website and use our mobile application (the "Platform").
                    </p>
                    <p>
                        By accessing or using the Platform, you agree to the terms of this Privacy Policy.
                    </p>

                    <h3>1. Information We Collect</h3>
                    <p>We collect information that you voluntarily provide to us when you register on the Platform.</p>
                    <ul>
                        <li><strong>Personal Data:</strong> Name, email address, mobile number, and exam preferences.</li>
                        <li><strong>Financial Data:</strong> Transaction details when you make a purchase (processed securely via third-party gateways; we do not store your card details).</li>
                        <li><strong>Usage Data:</strong> Test scores, progress reports, time spent on questions, and other learning analytics.</li>
                    </ul>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide, operate, and maintain our Platform.</li>
                        <li>Generate personalized performance analysis and recommendations.</li>
                        <li>Process your transactions and manage your subscription.</li>
                        <li>Send you educational content, updates, and promotional communications.</li>
                        <li>Detect and prevent fraudulent activities.</li>
                    </ul>

                    <h3>3. Sharing of Information</h3>
                    <p>
                        We do not sell your personal data. We may share information with strictly vetted third-party service providers (e.g., payment processors, cloud hosting) solely for the purpose of operating the Platform. We may also disclose information if required by law.
                    </p>

                    <h3>4. Data Security</h3>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
                    </p>

                    <h3>5. Cookies and Tracking</h3>
                    <p>
                        We use cookies to enhance your experience, such as keeping you logged in and remembering your preferences. You can disable cookies in your browser settings, but some features of the Platform may not function properly.
                    </p>

                    <h3>6. Contact Us</h3>
                    <p>
                        If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@testdone.in" className="text-primary-600 hover:underline">support@testdone.in</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
