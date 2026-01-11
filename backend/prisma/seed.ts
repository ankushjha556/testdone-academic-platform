import { PrismaClient, Difficulty, ContentStatus, TestType, AccessType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ============== CREATE ADMIN USER ==============
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@testdone.in' },
        update: {},
        create: {
            email: 'admin@testdone.in',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'TestDone',
            role: UserRole.SUPER_ADMIN,
            isEmailVerified: true,
        },
    });
    console.log('✅ Admin user created');

    // ============== CREATE EXAM CATEGORIES ==============
    const categories = [
        { name: 'Banking & Insurance', slug: 'banking', icon: 'Landmark', color: '#3B82F6', order: 1 },
        { name: 'SSC', slug: 'ssc', icon: 'Building2', color: '#10B981', order: 2 },
        { name: 'Railway', slug: 'railway', icon: 'Train', color: '#F59E0B', order: 3 },
        { name: 'Teaching', slug: 'teaching', icon: 'GraduationCap', color: '#F472B6', order: 4 },
        { name: 'Defence', slug: 'defence', icon: 'Shield', color: '#6366F1', order: 5 },
        { name: 'State Government', slug: 'state', icon: 'MapPin', color: '#EC4899', order: 6 },
    ];

    for (const cat of categories) {
        await prisma.examCategory.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
    }
    console.log('✅ Exam categories created');

    // ============== CREATE EXAMS ==============
    const bankingCategory = await prisma.examCategory.findUnique({ where: { slug: 'banking' } });
    const sscCategory = await prisma.examCategory.findUnique({ where: { slug: 'ssc' } });
    const railwayCategory = await prisma.examCategory.findUnique({ where: { slug: 'railway' } });

    const exams = [
        {
            name: 'IBPS PO',
            slug: 'ibps-po',
            fullName: 'IBPS Probationary Officer',
            description: 'IBPS PO is one of India\'s most prestigious banking examinations conducted annually by IBPS for recruitment to officer positions in participating banks.',
            eligibility: 'Graduate in any discipline from a recognized university. Age: 20-30 years.',
            conductingBody: 'Institute of Banking Personnel Selection',
            frequency: 'Annual',
            vacancies: '4,000-5,000',
            salaryRange: '₹52,000 - ₹89,000 per month',
            color: '#3B82F6',
            isFeatured: true,
            status: ContentStatus.PUBLISHED,
            categoryId: bankingCategory!.id,
            syllabus: {
                prelims: [
                    { section: 'English Language', questions: 30, marks: 30, time: 20 },
                    { section: 'Quantitative Aptitude', questions: 35, marks: 35, time: 20 },
                    { section: 'Reasoning Ability', questions: 35, marks: 35, time: 20 },
                ],
                mains: [
                    { section: 'Reasoning & Computer', questions: 45, marks: 60, time: 60 },
                    { section: 'English Language', questions: 35, marks: 40, time: 40 },
                    { section: 'Data Analysis', questions: 35, marks: 60, time: 45 },
                    { section: 'General Awareness', questions: 40, marks: 40, time: 35 },
                ],
            },
            examPattern: {
                stages: ['Prelims', 'Mains', 'Interview'],
                negativeMarking: 0.25,
            },
        },
        {
            name: 'SBI PO',
            slug: 'sbi-po',
            fullName: 'State Bank of India Probationary Officer',
            description: 'SBI PO is a highly competitive exam for officer recruitment in State Bank of India.',
            eligibility: 'Graduate, Age: 21-30 years',
            conductingBody: 'State Bank of India',
            frequency: 'Annual',
            vacancies: '2,000-3,000',
            salaryRange: '₹63,000 - ₹1,00,000 per month',
            color: '#2563EB',
            isFeatured: true,
            status: ContentStatus.PUBLISHED,
            categoryId: bankingCategory!.id,
        },
        {
            name: 'IBPS Clerk',
            slug: 'ibps-clerk',
            fullName: 'IBPS Clerical Cadre',
            description: 'IBPS Clerk exam for clerical positions in public sector banks.',
            eligibility: 'Graduate, Age: 20-28 years',
            conductingBody: 'IBPS',
            frequency: 'Annual',
            vacancies: '7,000-12,000',
            color: '#0EA5E9',
            status: ContentStatus.PUBLISHED,
            categoryId: bankingCategory!.id,
        },
        {
            name: 'SSC CGL',
            slug: 'ssc-cgl',
            fullName: 'Combined Graduate Level Examination',
            description: 'SSC CGL is conducted for recruitment to various Group B and C posts in ministries and departments.',
            eligibility: 'Graduate, Age: 18-32 years',
            conductingBody: 'Staff Selection Commission',
            frequency: 'Annual',
            vacancies: '8,000-10,000',
            color: '#10B981',
            isFeatured: true,
            status: ContentStatus.PUBLISHED,
            categoryId: sscCategory!.id,
        },
        {
            name: 'SSC CHSL',
            slug: 'ssc-chsl',
            fullName: 'Combined Higher Secondary Level',
            description: 'SSC CHSL for LDC, PA, SA and DEO posts.',
            eligibility: '12th Pass, Age: 18-27 years',
            conductingBody: 'Staff Selection Commission',
            frequency: 'Annual',
            color: '#059669',
            status: ContentStatus.PUBLISHED,
            categoryId: sscCategory!.id,
        },
        {
            name: 'RRB NTPC',
            slug: 'rrb-ntpc',
            fullName: 'Non-Technical Popular Categories',
            description: 'Railway recruitment for various non-technical posts.',
            eligibility: '12th/Graduate, Age: 18-33 years',
            conductingBody: 'Railway Recruitment Boards',
            frequency: 'As per requirement',
            vacancies: '35,000+',
            color: '#F59E0B',
            isFeatured: true,
            status: ContentStatus.PUBLISHED,
            categoryId: railwayCategory!.id,
        },
    ];

    for (const exam of exams) {
        await prisma.exam.upsert({
            where: { slug: exam.slug },
            update: exam,
            create: exam,
        });
    }
    console.log('✅ Exams created');

    // ============== CREATE SUBJECTS ==============
    const subjects = [
        { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude', icon: 'Calculator', color: '#3B82F6', order: 1 },
        { name: 'Reasoning Ability', slug: 'reasoning', icon: 'Brain', color: '#8B5CF6', order: 2 },
        { name: 'English Language', slug: 'english', icon: 'BookOpen', color: '#10B981', order: 3 },
        { name: 'General Awareness', slug: 'general-awareness', icon: 'Globe', color: '#F59E0B', order: 4 },
        { name: 'Computer Awareness', slug: 'computer', icon: 'Monitor', color: '#EC4899', order: 5 },
    ];

    for (const subj of subjects) {
        await prisma.subject.upsert({
            where: { slug: subj.slug },
            update: subj,
            create: subj,
        });
    }
    console.log('✅ Subjects created');

    // ============== CREATE TOPICS ==============
    const quantSubject = await prisma.subject.findUnique({ where: { slug: 'quantitative-aptitude' } });
    const reasoningSubject = await prisma.subject.findUnique({ where: { slug: 'reasoning' } });
    const englishSubject = await prisma.subject.findUnique({ where: { slug: 'english' } });

    const topics = [
        // Quant topics
        { name: 'Number System', slug: 'number-system', subjectId: quantSubject!.id, order: 1 },
        { name: 'Percentage', slug: 'percentage', subjectId: quantSubject!.id, order: 2 },
        { name: 'Profit and Loss', slug: 'profit-loss', subjectId: quantSubject!.id, order: 3 },
        { name: 'Simple Interest', slug: 'simple-interest', subjectId: quantSubject!.id, order: 4 },
        { name: 'Compound Interest', slug: 'compound-interest', subjectId: quantSubject!.id, order: 5 },
        { name: 'Ratio and Proportion', slug: 'ratio-proportion', subjectId: quantSubject!.id, order: 6 },
        { name: 'Time and Work', slug: 'time-work', subjectId: quantSubject!.id, order: 7 },
        { name: 'Data Interpretation', slug: 'data-interpretation', subjectId: quantSubject!.id, order: 8 },
        // Reasoning topics
        { name: 'Syllogism', slug: 'syllogism', subjectId: reasoningSubject!.id, order: 1 },
        { name: 'Blood Relations', slug: 'blood-relations', subjectId: reasoningSubject!.id, order: 2 },
        { name: 'Coding Decoding', slug: 'coding-decoding', subjectId: reasoningSubject!.id, order: 3 },
        { name: 'Puzzles', slug: 'puzzles', subjectId: reasoningSubject!.id, order: 4 },
        { name: 'Seating Arrangement', slug: 'seating-arrangement', subjectId: reasoningSubject!.id, order: 5 },
        { name: 'Inequality', slug: 'inequality', subjectId: reasoningSubject!.id, order: 6 },
        // English topics
        { name: 'Reading Comprehension', slug: 'reading-comprehension', subjectId: englishSubject!.id, order: 1 },
        { name: 'Cloze Test', slug: 'cloze-test', subjectId: englishSubject!.id, order: 2 },
        { name: 'Error Spotting', slug: 'error-spotting', subjectId: englishSubject!.id, order: 3 },
        { name: 'Para Jumbles', slug: 'para-jumbles', subjectId: englishSubject!.id, order: 4 },
    ];

    for (const topic of topics) {
        await prisma.topic.upsert({
            where: { subjectId_slug: { subjectId: topic.subjectId, slug: topic.slug } },
            update: topic,
            create: topic,
        });
    }
    console.log('✅ Topics created');

    // ============== CREATE SAMPLE QUESTIONS ==============
    const percentageTopic = await prisma.topic.findFirst({ where: { slug: 'percentage' } });
    const syllogismTopic = await prisma.topic.findFirst({ where: { slug: 'syllogism' } });
    const rcTopic = await prisma.topic.findFirst({ where: { slug: 'reading-comprehension' } });

    const sampleQuestions = [
        {
            questionText: 'If 40% of a number is 80, what is 25% of that number?',
            options: [
                { id: 'A', text: '40', isCorrect: false },
                { id: 'B', text: '50', isCorrect: true },
                { id: 'C', text: '60', isCorrect: false },
                { id: 'D', text: '45', isCorrect: false },
            ],
            correctAnswer: 'B',
            solution: 'Let the number be x. 40% of x = 80, so x = 80 × 100/40 = 200. 25% of 200 = 200 × 25/100 = 50.',
            conceptNote: 'To find a percentage of a number, multiply the number by the percentage and divide by 100.',
            difficulty: Difficulty.EASY,
            subjectId: quantSubject!.id,
            topicId: percentageTopic!.id,
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
        },
        {
            questionText: 'A shopkeeper marks his goods 40% above cost price. If he gives 25% discount, what is his profit percentage?',
            options: [
                { id: 'A', text: '5%', isCorrect: true },
                { id: 'B', text: '10%', isCorrect: false },
                { id: 'C', text: '15%', isCorrect: false },
                { id: 'D', text: '12%', isCorrect: false },
            ],
            correctAnswer: 'A',
            solution: 'Let CP = 100. MP = 140. SP = 140 - 25% of 140 = 140 - 35 = 105. Profit = 5%.',
            difficulty: Difficulty.MEDIUM,
            subjectId: quantSubject!.id,
            topicId: percentageTopic!.id,
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
        },
        {
            questionText: 'The population of a town increases by 10% annually. If the present population is 20,000, what will it be after 2 years?',
            options: [
                { id: 'A', text: '24,000', isCorrect: false },
                { id: 'B', text: '24,200', isCorrect: true },
                { id: 'C', text: '22,000', isCorrect: false },
                { id: 'D', text: '25,000', isCorrect: false },
            ],
            correctAnswer: 'B',
            solution: 'After 2 years = 20000 × (1.1)² = 20000 × 1.21 = 24,200',
            difficulty: Difficulty.MEDIUM,
            subjectId: quantSubject!.id,
            topicId: percentageTopic!.id,
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
        },
        {
            questionText: 'Statements:\nAll dogs are cats.\nSome cats are rats.\n\nConclusions:\nI. Some rats are dogs.\nII. Some cats are dogs.',
            options: [
                { id: 'A', text: 'Only I follows', isCorrect: false },
                { id: 'B', text: 'Only II follows', isCorrect: true },
                { id: 'C', text: 'Both follow', isCorrect: false },
                { id: 'D', text: 'Neither follows', isCorrect: false },
            ],
            correctAnswer: 'B',
            solution: 'All dogs are cats means some cats are dogs (converse). Some cats are rats does not guarantee some rats are dogs.',
            conceptNote: 'In syllogism, "All A are B" implies "Some B are A" but not the reverse.',
            difficulty: Difficulty.MEDIUM,
            subjectId: reasoningSubject!.id,
            topicId: syllogismTopic!.id,
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
        },
        {
            questionText: 'Pointing to a photograph, a man said "She is the daughter of the only son of my grandfather." How is the person in the photograph related to the man?',
            options: [
                { id: 'A', text: 'Sister', isCorrect: true },
                { id: 'B', text: 'Mother', isCorrect: false },
                { id: 'C', text: 'Daughter', isCorrect: false },
                { id: 'D', text: 'Aunt', isCorrect: false },
            ],
            correctAnswer: 'A',
            solution: 'Only son of grandfather = Father. Daughter of father = Sister.',
            difficulty: Difficulty.EASY,
            subjectId: reasoningSubject!.id,
            topicId: await prisma.topic.findFirst({ where: { slug: 'blood-relations' } }).then(t => t!.id),
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
        },
    ];

    for (const q of sampleQuestions) {
        await prisma.question.create({ data: q });
    }
    console.log('✅ Sample questions created');

    // ============== CREATE MOCK TEST ==============
    const ibpsPo = await prisma.exam.findUnique({ where: { slug: 'ibps-po' } });
    const allQuestions = await prisma.question.findMany({ where: { status: ContentStatus.PUBLISHED } });

    const mockTest = await prisma.mockTest.upsert({
        where: { slug: 'ibps-po-prelims-mock-1' },
        update: {},
        create: {
            name: 'IBPS PO Prelims Mock Test #1',
            slug: 'ibps-po-prelims-mock-1',
            description: 'Full-length IBPS PO Prelims mock test with 100 questions. Practice in exam-like conditions.',
            testType: TestType.FULL_LENGTH,
            totalQuestions: allQuestions.length,
            totalMarks: allQuestions.length,
            durationMinutes: 60,
            negativeMarking: 0.25,
            accessType: AccessType.FREE,
            isAllIndia: true,
            status: ContentStatus.PUBLISHED,
            examId: ibpsPo!.id,
            createdById: admin.id,
            instructions: `
        <h3>Instructions</h3>
        <ul>
          <li>This test contains ${allQuestions.length} questions</li>
          <li>Each correct answer: +1 mark</li>
          <li>Each wrong answer: -0.25 marks</li>
          <li>Total time: 60 minutes</li>
          <li>You can navigate between questions</li>
          <li>Test will auto-submit when time expires</li>
        </ul>
      `,
        },
    });

    // Add questions to test
    for (let i = 0; i < allQuestions.length; i++) {
        await prisma.testQuestion.upsert({
            where: { testId_questionId: { testId: mockTest.id, questionId: allQuestions[i].id } },
            update: {},
            create: {
                testId: mockTest.id,
                questionId: allQuestions[i].id,
                sectionIndex: 0,
                questionOrder: i + 1,
                marks: 1,
            },
        });
    }
    console.log('✅ Mock test created');

    // ============== CREATE SUBSCRIPTION PLANS ==============
    const plans = [
        { name: 'Monthly', slug: 'monthly', priceMonthly: 199, features: ['All mock tests', 'Full question bank', 'Analytics'], order: 1 },
        { name: 'Quarterly', slug: 'quarterly', priceMonthly: 149, priceQuarterly: 447, features: ['All mock tests', 'Full question bank', 'Analytics', 'Priority support'], order: 2 },
        { name: 'Annual', slug: 'annual', priceMonthly: 83, priceAnnual: 999, features: ['All mock tests', 'Full question bank', 'Analytics', 'Priority support', 'Downloadable PDFs'], order: 3 },
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan,
        });
    }
    console.log('✅ Subscription plans created');

    console.log('🎉 Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
