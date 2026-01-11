import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="min-h-screen py-16 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-heading text-gray-900 dark:text-white mb-4">Contact Us</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email Us</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">For general inquiries and support</p>
                                <a href="mailto:support@testdone.in" className="text-primary-600 font-medium hover:underline">support@testdone.in</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Phone className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Call Us</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">Mon-Sat from 9am to 6pm</p>
                                <a href="tel:+919315441351" className="text-primary-600 font-medium hover:underline">+91 9315441351</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Visit Us</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Patna, Bihar, India
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg">
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input type="text" className="input w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" className="input w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Message</label>
                                <textarea className="input w-full border border-gray-300 rounded-lg px-4 py-2 h-32" placeholder="How can we help?" />
                            </div>
                            <button className="btn btn-primary w-full">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
