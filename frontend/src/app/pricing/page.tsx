import Link from 'next/link';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';

const plans = [
    {
        name: 'Free',
        price: '₹0',
        period: 'forever',
        description: 'Get started with basic features',
        features: [
            '500+ Free Mock Tests',
            '10,000 Practice Questions',
            'Basic Analytics',
            'All-India Ranking',
            'Mobile App Access',
        ],
        cta: 'Start Free',
        href: '/signup',
        popular: false,
    },
    {
        name: 'Pro Monthly',
        price: '₹199',
        period: '/month',
        description: 'Full access for serious aspirants',
        features: [
            'All 5000+ Mock Tests',
            '1 Lakh+ Questions with Solutions',
            'Detailed Performance Analytics',
            'Topic-wise Analysis',
            'PDF Downloads',
            'Priority Support',
            'Ad-free Experience',
        ],
        cta: 'Start Pro',
        href: '/checkout?plan=monthly',
        popular: true,
    },
    {
        name: 'Pro Annual',
        price: '₹999',
        period: '/year',
        originalPrice: '₹2,388',
        savings: 'Save ₹1,389',
        description: 'Best value for long-term prep',
        features: [
            'Everything in Pro Monthly',
            '2 Months Free',
            'Exclusive Study Materials',
            'Live Doubt Sessions',
            'Personal Mentor Support',
            'Priority Feature Requests',
        ],
        cta: 'Get Best Value',
        href: '/checkout?plan=annual',
        popular: false,
    },
];

const faqs = [
    {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, Net Banking, and popular wallets like Paytm and PhonePe.',
    },
    {
        q: 'Is there a refund policy?',
        a: 'Yes, we offer a 7-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
    },
    {
        q: 'Can I switch between plans?',
        a: 'Yes, you can upgrade or downgrade your plan at any time. The difference will be prorated.',
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen py-12 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-4">
                        <Zap className="w-4 h-4" />
                        Trusted by 25 Lakh+ Students
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that works for you. Start free and upgrade when you're ready.
                    </p>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`card relative overflow-hidden ${plan.popular
                                    ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                                    : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-500">{plan.period}</span>
                                    </div>
                                    {plan.originalPrice && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-gray-400 line-through text-sm">{plan.originalPrice}</span>
                                            <span className="text-green-600 text-sm font-medium">{plan.savings}</span>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={plan.href}
                                    className={`btn w-full justify-center ${plan.popular ? 'btn-primary' : 'btn-secondary'
                                        }`}
                                >
                                    {plan.cta}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="px-6 pb-6">
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                                        What's included:
                                    </p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Guarantee */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <Star className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                7-Day Money-Back Guarantee
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Try risk-free. Not satisfied? Get a full refund, no questions asked.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQs */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <div key={faq.q} className="card p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="text-center mt-16">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Still have questions? We're here to help.
                    </p>
                    <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
                        Contact Support →
                    </Link>
                </div>
            </div>
        </div>
    );
}
