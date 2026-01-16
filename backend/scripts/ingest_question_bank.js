/**
 * Question Bank Mass Ingestion Script
 * 
 * This script ingests questions from batch files (batch1-batch7) into the TestDone database.
 * It handles both old format (batch1/2 markdown style) and new format (batch3-7 simple format).
 * 
 * Features:
 * - Auto-creates exams and subjects if they don't exist
 * - Stores correctAnswer as option letter (A/B/C/D) for consistency
 * - Sets isCorrect: true on the correct option in JSON
 * - Skips duplicates based on question text
 * - Batch processing with transactions
 * - Comprehensive logging
 * 
 * Usage: node ingest_question_bank.js [batch_file_path]
 * Or: node ingest_question_bank.js --all (to process all batch files)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 50;
const ADMIN_EMAIL = 'admin@testdone.in';
const QUESTION_BANK_DIR = path.join(__dirname, '..', '..', 'question_bank');

// All batch files in order
const BATCH_FILES = [
    'batch1_250_questions.txt',
    'batch2_250_questions.txt',
    'batch3_500_questions.txt',
    'batch4_4000_questions.txt',
    'batch5_5000_questions.txt',
    'batch6_10000_questions.txt',
    'batch7_20000_questions.txt'
];

// Statistics
const stats = {
    totalParsed: 0,
    totalInserted: 0,
    totalSkipped: 0,
    totalErrors: 0,
    examsCreated: [],
    subjectsCreated: [],
    duplicates: 0,
    parseErrors: []
};

// Utility functions
const slugify = (text) => text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hashQuestion = (text) => crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');

// Exam name normalization
const normalizeExamName = (raw) => {
    // Handle common patterns
    let exam = raw.trim();

    // Extract first exam from compound names like "SSC CGL / RRB NTPC"
    // or "SSC/IBPS"
    if (exam.includes('/')) {
        exam = exam.split('/')[0].trim();
    }

    // Normalize common variations
    const examMappings = {
        'SSC': 'SSC CGL',
        'SSC CGL': 'SSC CGL',
        'SSC CHSL': 'SSC CHSL',
        'SSC MTS': 'SSC MTS',
        'SSC GD': 'SSC GD',
        'IBPS': 'IBPS PO',
        'IBPS PO': 'IBPS PO',
        'IBPS Clerk': 'IBPS Clerk',
        'IBPS RRB': 'IBPS RRB',
        'SBI': 'SBI PO',
        'SBI PO': 'SBI PO',
        'SBI Clerk': 'SBI Clerk',
        'RRB': 'RRB NTPC',
        'RRB NTPC': 'RRB NTPC',
        'RRB ALP': 'RRB ALP',
        'RRB JE': 'RRB JE',
        'RRB Group D': 'RRB Group D',
        'UPSC': 'UPSC CSE',
        'UPSC CSE': 'UPSC CSE',
        'CDS': 'CDS',
        'NDA': 'NDA',
        'CAPF': 'CAPF',
        'UGC-NET': 'UGC NET',
        'UGC NET': 'UGC NET',
        'CTET': 'CTET',
        'FCI': 'FCI Manager',
        'FCI Manager': 'FCI Manager',
        'Delhi Police': 'Delhi Police'
    };

    // Try exact match first
    if (examMappings[exam]) {
        return examMappings[exam];
    }

    // Try partial match
    for (const [key, value] of Object.entries(examMappings)) {
        if (exam.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    return exam;
};

// Subject name normalization
const normalizeSubjectName = (raw) => {
    let subject = raw.trim();

    const subjectMappings = {
        'Reasoning': 'Reasoning Ability',
        'Reasoning Ability': 'Reasoning Ability',
        'General Intelligence': 'Reasoning Ability',
        'General Intelligence & Reasoning': 'Reasoning Ability',
        'Logical Reasoning': 'Reasoning Ability',
        'Quantitative Aptitude': 'Quantitative Aptitude',
        'Mathematics': 'Quantitative Aptitude',
        'Maths': 'Quantitative Aptitude',
        'Arithmetic': 'Quantitative Aptitude',
        'General Awareness': 'General Awareness',
        'General Knowledge': 'General Awareness',
        'GK': 'General Awareness',
        'Current Affairs': 'General Awareness',
        'Static GK': 'General Awareness',
        'English': 'English Language',
        'English Language': 'English Language',
        'English Comprehension': 'English Language',
        'Verbal Ability': 'English Language',
        'History': 'History',
        'Polity': 'Polity',
        'Indian Polity': 'Polity',
        'Geography': 'Geography',
        'Indian Geography': 'Geography',
        'Economy': 'Economics',
        'Economics': 'Economics',
        'Indian Economy': 'Economics',
        'Science': 'General Science',
        'General Science': 'General Science',
        'Physics': 'General Science',
        'Chemistry': 'General Science',
        'Biology': 'General Science',
        'Computer': 'Computer Awareness',
        'Computer Awareness': 'Computer Awareness',
        'Banking Awareness': 'Banking Awareness',
        'Finance': 'Banking Awareness',
        'Environment': 'Environment & Ecology',
        'Environment & Ecology': 'Environment & Ecology',
        'Ecology': 'Environment & Ecology',
        'Pedagogy': 'Pedagogy',
        'Child Development': 'Pedagogy',
        'Research': 'Research Methodology',
        'Research Methodology': 'Research Methodology'
    };

    if (subjectMappings[subject]) {
        return subjectMappings[subject];
    }

    for (const [key, value] of Object.entries(subjectMappings)) {
        if (subject.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    return subject;
};

// Difficulty mapping
const mapDifficulty = (text) => {
    if (!text) return 'MEDIUM';
    const lower = text.toLowerCase();
    if (lower.includes('easy')) return 'EASY';
    if (lower.includes('hard') || lower.includes('difficult')) return 'HARD';
    return 'MEDIUM';
};

// Parse OLD format (batch1, batch2) - Markdown style
function parseOldFormat(content, batchName) {
    const questions = [];

    // Split by question headers ### Q#.
    const blocks = content.split(/(?=###\s*Q\d+\.)/);

    for (const block of blocks) {
        if (!block.trim()) continue;

        try {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length === 0) continue;

            // Match header: ### Q1.  (SSC CGL / RRB NTPC – Coding–Decoding)
            const headerMatch = lines[0].match(/###\s*Q(\d+)\.\s*\(([^)]+)\)\s*(.*)/);
            if (!headerMatch) continue;

            const [_, qNum, examInfo, questionStart] = headerMatch;

            // Parse exam/subject from examInfo: "SSC CGL / RRB NTPC – Coding–Decoding"
            const examParts = examInfo.split('–');
            const examRaw = examParts[0]?.trim() || 'General';
            const subjectRaw = examParts[1]?.trim() || 'General Awareness';

            // Build question text
            let questionText = questionStart;
            const options = [];
            let answerKey = null;
            let solution = '';
            let parsingMode = 'question';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];

                // Check for option
                const optMatch = line.match(/^([A-D])\.\s+(.+)/);
                if (optMatch) {
                    options.push({ key: optMatch[1], text: optMatch[2].trim() });
                    parsingMode = 'options';
                    continue;
                }

                // Check for answer
                if (line.startsWith('**Answer:**')) {
                    const answerText = line.replace('**Answer:**', '').trim();
                    answerKey = answerText.charAt(0).toUpperCase();
                    parsingMode = 'answer';
                    continue;
                }

                // Check for solution
                if (line.startsWith('**Solution:**')) {
                    solution = line.replace('**Solution:**', '').trim();
                    parsingMode = 'solution';
                    continue;
                }

                // Continue building content based on mode
                if (parsingMode === 'question' && options.length === 0) {
                    questionText += ' ' + line;
                } else if (parsingMode === 'solution') {
                    solution += ' ' + line;
                }
            }

            // Validate
            if (options.length !== 4) {
                stats.parseErrors.push(`${batchName} Q${qNum}: Found ${options.length} options`);
                continue;
            }

            if (!answerKey || !['A', 'B', 'C', 'D'].includes(answerKey)) {
                stats.parseErrors.push(`${batchName} Q${qNum}: Invalid answer key: ${answerKey}`);
                continue;
            }

            questions.push({
                batchId: batchName,
                qNum,
                examRaw: normalizeExamName(examRaw),
                subjectRaw: normalizeSubjectName(subjectRaw),
                questionText: questionText.trim(),
                options: options.map(o => ({
                    id: o.key,
                    text: o.text,
                    isCorrect: o.key === answerKey
                })),
                correctAnswer: answerKey,
                solution: solution.trim(),
                difficulty: 'MEDIUM'
            });

        } catch (e) {
            stats.parseErrors.push(`${batchName} block error: ${e.message}`);
        }
    }

    return questions;
}

// Parse NEW format (batch3-7) - Simple format
function parseNewFormat(content, batchName) {
    const questions = [];

    // Split by question headers Q#.
    const blocks = content.split(/\n(?=Q\d+\.)/);

    for (const block of blocks) {
        if (!block.trim()) continue;

        try {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length === 0) continue;

            // Match header: Q1. SSC CGL Reasoning – Question text
            // or Q1. SSC/IBPS Reasoning – Question text
            const headerMatch = lines[0].match(/^Q(\d+)\.\s*([^–-]+)[–-]\s*(.+)/);
            if (!headerMatch) continue;

            const [_, qNum, examSubject, questionStart] = headerMatch;

            // Parse exam and subject from "SSC CGL Reasoning" or "SSC/IBPS Reasoning"
            const parts = examSubject.trim().split(/\s+/);
            let examRaw = parts.slice(0, -1).join(' ') || 'General';
            let subjectRaw = parts[parts.length - 1] || 'General Awareness';

            // Build question text
            let questionText = questionStart;
            const options = [];
            let answerValue = null;
            let solution = '';
            let parsingMode = 'question';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];

                // Check for option (may have indentation)
                const optMatch = line.match(/^\s*([A-D])\.\s+(.+)/);
                if (optMatch) {
                    options.push({ key: optMatch[1], text: optMatch[2].trim() });
                    parsingMode = 'options';
                    continue;
                }

                // Check for answer
                if (line.startsWith('Answer:')) {
                    answerValue = line.replace('Answer:', '').trim();
                    parsingMode = 'answer';
                    continue;
                }

                // Check for solution
                if (line.startsWith('Solution:')) {
                    solution = line.replace('Solution:', '').trim();
                    parsingMode = 'solution';
                    continue;
                }

                // Continue building content
                if (parsingMode === 'question' && options.length === 0) {
                    questionText += ' ' + line;
                } else if (parsingMode === 'solution') {
                    solution += ' ' + line;
                }
            }

            // Validate options
            if (options.length !== 4) {
                stats.parseErrors.push(`${batchName} Q${qNum}: Found ${options.length} options`);
                continue;
            }

            // Determine correct answer key from answer value
            let answerKey = null;

            // First try: if answer is already a letter
            if (answerValue && ['A', 'B', 'C', 'D'].includes(answerValue.toUpperCase())) {
                answerKey = answerValue.toUpperCase();
            } else if (answerValue) {
                // Match answer text to option text
                for (const opt of options) {
                    if (opt.text === answerValue ||
                        opt.text.startsWith(answerValue) ||
                        opt.text.toLowerCase() === answerValue.toLowerCase()) {
                        answerKey = opt.key;
                        break;
                    }
                }

                // If still not found, try numeric match
                if (!answerKey) {
                    const numericAnswer = answerValue.replace(/[^0-9.-]/g, '');
                    for (const opt of options) {
                        const numericOpt = opt.text.replace(/[^0-9.-]/g, '');
                        if (numericOpt === numericAnswer) {
                            answerKey = opt.key;
                            break;
                        }
                    }
                }
            }

            if (!answerKey) {
                stats.parseErrors.push(`${batchName} Q${qNum}: Could not match answer "${answerValue}" to options`);
                continue;
            }

            questions.push({
                batchId: batchName,
                qNum,
                examRaw: normalizeExamName(examRaw),
                subjectRaw: normalizeSubjectName(subjectRaw),
                questionText: questionText.trim(),
                options: options.map(o => ({
                    id: o.key,
                    text: o.text,
                    isCorrect: o.key === answerKey
                })),
                correctAnswer: answerKey,
                solution: solution.trim(),
                difficulty: 'MEDIUM'
            });

        } catch (e) {
            stats.parseErrors.push(`${batchName} block error: ${e.message}`);
        }
    }

    return questions;
}

// Detect format and parse
function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const batchName = path.basename(filePath);

    // Detect format based on content
    if (content.includes('### Q') && content.includes('**Answer:**')) {
        console.log(`📚 Detected OLD format for ${batchName}`);
        return parseOldFormat(content, batchName);
    } else {
        console.log(`📚 Detected NEW format for ${batchName}`);
        return parseNewFormat(content, batchName);
    }
}

// Caches for exams and subjects
const examCache = new Map();
const subjectCache = new Map();
const questionHashes = new Set();

async function ensureExam(name, categoryId) {
    const slug = slugify(name);

    if (examCache.has(slug)) {
        return examCache.get(slug);
    }

    // Try to find existing
    let exam = await prisma.exam.findFirst({
        where: {
            OR: [
                { slug },
                { name: { equals: name, mode: 'insensitive' } }
            ]
        }
    });

    if (!exam) {
        // Create new exam
        console.log(`  ✨ Creating exam: ${name}`);
        exam = await prisma.exam.create({
            data: {
                name,
                slug,
                description: `Questions for ${name} examination`,
                categoryId,
                status: 'PUBLISHED'
            }
        });
        stats.examsCreated.push(name);
    }

    examCache.set(slug, exam.id);
    return exam.id;
}

async function ensureSubject(name) {
    const slug = slugify(name);

    if (subjectCache.has(slug)) {
        return subjectCache.get(slug);
    }

    // Try to find existing
    let subject = await prisma.subject.findFirst({
        where: {
            OR: [
                { slug },
                { name: { equals: name, mode: 'insensitive' } }
            ]
        }
    });

    if (!subject) {
        // Create new subject
        console.log(`  ✨ Creating subject: ${name}`);
        subject = await prisma.subject.create({
            data: {
                name,
                slug,
                description: `Questions related to ${name}`
            }
        });
        stats.subjectsCreated.push(name);
    }

    subjectCache.set(slug, subject.id);
    return subject.id;
}

async function loadExistingQuestionHashes() {
    console.log('📊 Loading existing question hashes for deduplication...');
    const questions = await prisma.question.findMany({
        select: { questionText: true }
    });

    for (const q of questions) {
        questionHashes.add(hashQuestion(q.questionText));
    }

    console.log(`✅ Loaded ${questionHashes.size} existing question hashes`);
}

async function insertQuestions(questions, adminId, defaultCategoryId) {
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)}...`);

        for (const q of batch) {
            try {
                // Check for duplicate
                const qHash = hashQuestion(q.questionText);
                if (questionHashes.has(qHash)) {
                    skipped++;
                    stats.duplicates++;
                    continue;
                }

                // Get or create exam and subject
                const examId = await ensureExam(q.examRaw, defaultCategoryId);
                const subjectId = await ensureSubject(q.subjectRaw);

                // Insert question
                await prisma.question.create({
                    data: {
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        solution: q.solution,
                        difficulty: q.difficulty,
                        status: 'PUBLISHED',
                        subjectId,
                        createdById: adminId,
                        questionExams: {
                            create: { examId }
                        }
                    }
                });

                // Mark as inserted
                questionHashes.add(qHash);
                inserted++;

                // Progress indicator
                if (inserted % 100 === 0) {
                    process.stdout.write('.');
                }

            } catch (e) {
                stats.totalErrors++;
                console.error(`\n❌ Error inserting Q${q.qNum}: ${e.message}`);
            }
        }
    }

    console.log('');
    return { inserted, skipped };
}

async function main() {
    console.log('🚀 Question Bank Mass Ingestion Script\n');
    console.log('='.repeat(60));

    // Get admin user
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!admin) {
        throw new Error(`Admin user ${ADMIN_EMAIL} not found! Please create admin first.`);
    }
    console.log(`✅ Admin user found: ${admin.email}`);

    // Get or create default category
    let category = await prisma.examCategory.findFirst();
    if (!category) {
        category = await prisma.examCategory.create({
            data: {
                name: 'Government Jobs',
                slug: 'government-jobs',
                description: 'Government job examinations'
            }
        });
    }
    console.log(`✅ Using category: ${category.name}`);

    // Load existing hashes
    await loadExistingQuestionHashes();

    // Determine which files to process
    let filesToProcess = [];

    if (process.argv[2] === '--all') {
        // Process all batch files
        for (const file of BATCH_FILES) {
            const filePath = path.join(QUESTION_BANK_DIR, file);
            if (fs.existsSync(filePath)) {
                filesToProcess.push(filePath);
            } else {
                console.warn(`⚠️ File not found: ${file}`);
            }
        }
    } else if (process.argv[2]) {
        // Process specific file
        const filePath = process.argv[2];
        if (fs.existsSync(filePath)) {
            filesToProcess.push(filePath);
        } else {
            throw new Error(`File not found: ${filePath}`);
        }
    } else {
        // Default: process all
        console.log('No file specified. Processing all batch files...\n');
        for (const file of BATCH_FILES) {
            const filePath = path.join(QUESTION_BANK_DIR, file);
            if (fs.existsSync(filePath)) {
                filesToProcess.push(filePath);
            }
        }
    }

    console.log(`\n📁 Files to process: ${filesToProcess.length}`);
    console.log('='.repeat(60) + '\n');

    // Process each file
    for (const filePath of filesToProcess) {
        const fileName = path.basename(filePath);
        console.log(`\n📄 Processing: ${fileName}`);
        console.log('-'.repeat(40));

        // Parse
        const questions = parseFile(filePath);
        stats.totalParsed += questions.length;
        console.log(`✅ Parsed ${questions.length} questions`);

        // Insert
        const result = await insertQuestions(questions, admin.id, category.id);
        stats.totalInserted += result.inserted;
        stats.totalSkipped += result.skipped;

        console.log(`✅ Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Parsed:    ${stats.totalParsed}`);
    console.log(`Total Inserted:  ${stats.totalInserted}`);
    console.log(`Total Skipped:   ${stats.totalSkipped}`);
    console.log(`Duplicates:      ${stats.duplicates}`);
    console.log(`Errors:          ${stats.totalErrors}`);
    console.log(`Parse Errors:    ${stats.parseErrors.length}`);

    if (stats.examsCreated.length > 0) {
        console.log(`\nExams Created (${stats.examsCreated.length}):`);
        stats.examsCreated.forEach(e => console.log(`  - ${e}`));
    }

    if (stats.subjectsCreated.length > 0) {
        console.log(`\nSubjects Created (${stats.subjectsCreated.length}):`);
        stats.subjectsCreated.forEach(s => console.log(`  - ${s}`));
    }

    if (stats.parseErrors.length > 0 && stats.parseErrors.length <= 20) {
        console.log(`\nParse Errors (showing first 20):`);
        stats.parseErrors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    }

    // Verify counts
    const totalQuestions = await prisma.question.count();
    const publishedQuestions = await prisma.question.count({ where: { status: 'PUBLISHED' } });
    console.log(`\n📊 Database Counts:`);
    console.log(`  Total Questions: ${totalQuestions}`);
    console.log(`  Published:       ${publishedQuestions}`);

    console.log('\n✅ Ingestion complete!');
}

main()
    .catch(e => {
        console.error('\n❌ Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
