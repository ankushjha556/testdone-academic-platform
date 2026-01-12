import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPage() {
    return (
        <div className="min-h-screen py-16 bg-white dark:bg-gray-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Refund and Cancellation Policy</h1>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Last updated: January 2026</p>

                    <h3>1. No Refund Policy</h3>
                    <p>
                        At TestDone, we strive to provide the highest quality educational content and mock tests. Please read this policy carefully before making any purchase.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 my-6">
                        <p className="text-red-700 dark:text-red-400 font-medium m-0">
                            Strict No Refund Policy: Once a subscription plan or any digital product is purchased on TestDone, the money is NOT refundable under any circumstances.
                        </p>
                    </div>

                    <h3>2. Free Trials and Demos</h3>
                    <p>
                        We understand the importance of evaluating our platform before committing. That is why we offer:
                    </p>
                    <ul>
                        <li>Free detailed mock tests for various exams.</li>
                        <li>Sample study materials and question banks.</li>
                        <li>Access to basic features without any cost.</li>
                    </ul>
                    <p>
                        We strongly recommend that you use these free resources to assess the quality and suitability of our content before purchasing a paid subscription.
                    </p>

                    <h3>3. Non-Transferable</h3>
                    <p>
                        Subscriptions are personal and non-transferable. You may not transfer your subscription or account to another person.
                    </p>

                    <h3>4. Cancellation of Subscription</h3>
                    <p>
                        You can cancel your subscription renewal at any time through your account settings. However, cancellation does not generate a refund for the current billing period. You will continue to have access to the service until the end of your current billing cycle.
                    </p>

                    <h3>5. Technical Issues</h3>
                    <p>
                        In the rare event of a technical failure (e.g., double deduction of payment), please contact our support team immediately at <a href="mailto:support@testdone.in" className="text-primary-600 hover:underline">support@testdone.in</a>. Such cases will be reviewed individually, and refunds may be processed solely at the discretion of TestDone management for technical errors.
                    </p>

                    <p className="mt-8 text-sm text-gray-500">
                        For any questions regarding this policy, please contact us at support@testdone.in.
                    </p>
                </div>
            </div>
        </div>
    );
}
