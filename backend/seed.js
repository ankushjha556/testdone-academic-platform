const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ============== CREATE ADMIN USER ==============
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);

    // Check if admin exists to avoid overwriting password if not intended, although upsert is safe
    const admin = await prisma.user.upsert({
        where: { email: 'admin@testdone.in' },
        update: {},
        create: {
            email: 'admin@testdone.in',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'TestDone',
            role: 'SUPER_ADMIN',
            isEmailVerified: true,
        },
    });
    console.log('✅ Admin user ensured');

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
            description: 'IBPS PO is one of India\'s most prestigious banking examinations.',
            status: 'PUBLISHED',
            categoryId: bankingCategory.id,
        },
        {
            name: 'SSC CGL',
            slug: 'ssc-cgl',
            fullName: 'Combined Graduate Level Examination',
            status: 'PUBLISHED',
            categoryId: sscCategory.id,
        }
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
    ];

    for (const subj of subjects) {
        await prisma.subject.upsert({
            where: { slug: subj.slug },
            update: subj,
            create: subj,
        });
    }
    console.log('✅ Subjects created');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
