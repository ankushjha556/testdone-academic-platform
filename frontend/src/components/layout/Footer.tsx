import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

const footerLinks = {
    exams: [
        { label: 'IBPS PO', href: '/exams/ibps-po' },
        { label: 'SBI PO', href: '/exams/sbi-po' },
        { label: 'SSC CGL', href: '/exams/ssc-cgl' },
        { label: 'RRB NTPC', href: '/exams/rrb-ntpc' },
        { label: 'View All Exams', href: '/exams' },
    ],
    resources: [
        { label: 'Mock Tests', href: '/tests' },
        { label: 'Question Bank', href: '/questions' },
        { label: 'Books & PDFs', href: '/books' },
        { label: 'Current Affairs', href: '/current-affairs' },
        { label: 'Blog', href: '/blog' },
    ],
    company: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
    ],
};

export function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">T</span>
                            </div>
                            <span className="text-2xl font-bold font-heading text-white">
                                Test<span className="text-primary-400">Done</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            India's most trusted platform for competitive exam preparation.
                            Join 25 lakh+ students preparing for Banking, SSC, Railway, and more.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-primary-400" />
                                <a href="mailto:support@testdone.in" className="hover:text-primary-400">
                                    support@testdone.in
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-primary-400" />
                                <a href="tel:+919315441351" className="hover:text-primary-400">
                                    +91 9315441351
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-primary-400" />
                                <span>Patna, Bihar, India</span>
                            </div>
                        </div>
                    </div>

                    {/* Exams */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Popular Exams</h4>
                        <ul className="space-y-2">
                            {footerLinks.exams.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-800">
                    <span className="text-sm text-gray-500">Follow us:</span>
                    <div className="flex gap-3">
                        {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-800 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} TestDone Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="/privacy" className="hover:text-primary-400">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary-400">Terms</Link>
                        <Link href="/refund" className="hover:text-primary-400">Refund Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
