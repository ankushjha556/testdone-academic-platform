import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen py-16 bg-white dark:bg-gray-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms and Conditions</h1>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500">Last updated: January 2026</p>

                    <p>
                        Welcome to TestDone! These Terms and Conditions outline the rules and regulations for the use of the TestDone website and mobile application. By accessing this platform, we assume you accept these terms and conditions. Do not continue to use TestDone if you do not agree to take all of the terms and conditions stated on this page.
                    </p>

                    <h3>1. Account Registration</h3>
                    <p>
                        To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
                    </p>

                    <h3>2. Intellectual Property Rights</h3>
                    <p>
                        Other than the content you own, under these Terms, TestDone and/or its licensors own all the intellectual property rights and materials contained in this Platform. You are granted limited license only for purposes of viewing the material contained on this Platform for personal, non-commercial use.
                    </p>
                    <p>You must not:</p>
                    <ul>
                        <li>Republish material from TestDone</li>
                        <li>Sell, rent, or sub-license material from TestDone</li>
                        <li>Reproduce, duplicate or copy material from TestDone</li>
                        <li>Redistribute content from TestDone (unless content is specifically made for redistribution)</li>
                    </ul>

                    <h3>3. User Content and Conduct</h3>
                    <p>
                        In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant TestDone a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
                    </p>

                    <h3>4. Payment and Refunds</h3>
                    <p>
                        All payments made on the TestDone platform are final. Please review our Refund Policy for details. We reserve the right to change our pricing at any time.
                    </p>

                    <h3>5. Limitation of Liability</h3>
                    <p>
                        In no event shall TestDone, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this Platform whether such liability is under contract. TestDone, including its officers, directors, and employees shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this Platform.
                    </p>

                    <h3>6. Termination</h3>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h3>7. Governing Law</h3>
                    <p>
                        These Terms will be governed by and interpreted in accordance with the laws of India, and you submit to the non-exclusive jurisdiction of the state and federal courts located in India for the resolution of any disputes.
                    </p>

                    <p className="mt-8 text-sm text-gray-500">
                        For any questions regarding these Terms, please contact us at support@testdone.in.
                    </p>
                </div>
            </div>
        </div>
    );
}
