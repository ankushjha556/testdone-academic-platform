export default function AboutPage() {
    return (
        <div className="min-h-screen py-16 bg-white dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold font-heading text-gray-900 dark:text-white mb-6">About TestDone</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                    Empowering students to achieve their dreams through accessible, high-quality, and data-driven exam preparation.
                </p>

                <div className="prose dark:prose-invert mx-auto text-left">
                    <p>
                        TestDone was founded with a simple mission: to democratize access to quality education and exam preparation resources.
                        We believe that every student, regardless of their background or location, deserves the best tools to crack competitive exams.
                    </p>
                    <p>
                        Our platform combines expert-curated content with cutting-edge technology to provide personalized learning experiences.
                        With over 5,000 mock tests, 1 lakh+ questions, and detailed analytics, we help you identify your strengths and weaknesses.
                    </p>
                    <h3>Our Vision</h3>
                    <p>
                        To become India's most trusted and effective exam preparation platform, helping millions of students secure government jobs and public sector careers.
                    </p>
                </div>
            </div>
        </div>
    );
}
