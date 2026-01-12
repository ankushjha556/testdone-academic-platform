const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🚀 Starting Clean Seed...');

    // 1. Cleanup
    const deleteResult = await prisma.question.deleteMany({
        where: { testQuestions: { none: {} } }
    });
    console.log(`✅ Deleted ${deleteResult.count} unlinked questions.`);

    // 2. Read File
    const batchFilePath = path.join(__dirname, '../questions_batch2_formatted_complete.txt');
    const fileContent = fs.readFileSync(batchFilePath, 'utf-8');
    const lines = fileContent.split('\n');

    let currentQuestion = null;
    let successCount = 0;

    // Maps
    const examMap = new Map();
    const existingExams = await prisma.exam.findMany();
    existingExams.forEach(e => examMap.set(e.name.toLowerCase().trim(), e.id));

    // Admin/Cat cache
    let adminUserId = null;
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) adminUserId = admin.id;

    let categoryId = null;
    const cat = await prisma.examCategory.findFirst();
    if (cat) categoryId = cat.id;
    else {
        const newCat = await prisma.examCategory.create({ data: { name: 'General', slug: 'general' } });
        categoryId = newCat.id;
    }

    // Subject map (simplified)
    const subjectMap = new Map();
    const allSubjects = await prisma.subject.findMany();
    allSubjects.forEach(s => subjectMap.set(s.name.toLowerCase(), s.id));
    let currentSubjectId = subjectMap.get("general intelligence & reasoning");
    if (!currentSubjectId && allSubjects.length > 0) currentSubjectId = allSubjects[0].id;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('## ')) {
            // Subject switch logic if needed
            const subName = line.replace('## ', '').split('(')[0].trim().toLowerCase();
            if (subjectMap.has(subName)) currentSubjectId = subjectMap.get(subName);
            continue;
        }

        if (line.startsWith('### Q')) {
            if (currentQuestion) {
                await save(currentQuestion, examMap, adminUserId, categoryId);
                successCount++;
            }

            // Parse Header
            let examName = "SSC CGL";
            let topicName = "General";

            // Heuristic Parsing
            const lower = line.toLowerCase();

            if (lower.indexOf('(ssc chsl') > -1) {
                examName = "SSC CHSL";
                topicName = extractTopic(line, "SSC CHSL");
            } else if (lower.indexOf('(rrb je') > -1) {
                examName = "RRB JE";
                topicName = extractTopic(line, "RRB JE");
            } else if (lower.indexOf('(upsc capf') > -1) {
                examName = "UPSC CAPF";
                topicName = extractTopic(line, "UPSC CAPF");
            } else if (lower.indexOf('(ibps clerk') > -1) {
                examName = "IBPS Clerk";
                topicName = extractTopic(line, "IBPS Clerk");
            } else if (lower.indexOf('(sbi clerk') > -1) {
                examName = "SBI Clerk";
                topicName = extractTopic(line, "SBI Clerk");
            } else {
                console.log(`⚠️ Unmatched Header: ${line}`);
            }

            currentQuestion = {
                examName,
                topicName,
                text: '',
                options: [],
                answer: '',
                explanation: '',
                subjectId: currentSubjectId
            };
            continue;
        }

        if (currentQuestion) {
            if (line.startsWith('A.') || line.startsWith('(A)')) {
                currentQuestion.options.push({ id: 'A', text: line.replace(/^(A\.| \(A\)) /, '').trim() });
            } else if (line.startsWith('B.') || line.startsWith('(B)')) {
                currentQuestion.options.push({ id: 'B', text: line.replace(/^(B\.| \(B\)) /, '').trim() });
            } else if (line.startsWith('C.') || line.startsWith('(C)')) {
                currentQuestion.options.push({ id: 'C', text: line.replace(/^(C\.| \(C\)) /, '').trim() });
            } else if (line.startsWith('D.') || line.startsWith('(D)')) {
                currentQuestion.options.push({ id: 'D', text: line.replace(/^(D\.| \(D\)) /, '').trim() });
            } else if (line.startsWith('**Answer:**')) {
                const ansRaw = line.replace('**Answer:**', '').trim();
                currentQuestion.answer = ansRaw.charAt(0);
            } else if (line.startsWith('**Explanation:**')) {
                currentQuestion.explanation = line.replace('**Explanation:**', '').trim();
            } else if (line.startsWith('---')) {
                // ignore
            } else {
                if (currentQuestion.options.length === 0) {
                    currentQuestion.text += (currentQuestion.text ? '\n' : '') + line;
                }
            }
        }
    }

    // Save last
    if (currentQuestion) {
        await save(currentQuestion, examMap, adminUserId, categoryId);
        successCount++;
    }

    console.log(`✨ Completed! Processed ${successCount} questions.`);
}

function extractTopic(line, examKey) {
    // line: ### Q1. (SSC CHSLâ€“ Analogy)
    // Remove ### Q... (SSC CHSL
    // Then trim rest.
    // Ideally use split.
    const inner = line.match(/\((.*?)\)/);
    if (inner) {
        // inner[1] = SSC CHSLâ€“ Analogy
        // Remove examKey
        let rest = inner[1].substring(examKey.length).trim();
        // Remove separator chars (mojibake or whatever)
        rest = rest.replace(/^[^a-zA-Z0-9]+/, '').trim();
        return rest || "General";
    }
    return "General";
}

async function save(q, examMap, userId, catId) {
    // 1. Resolve Exam
    let examId = examMap.get(q.examName.toLowerCase());
    if (!examId) {
        // Create
        const slug = q.examName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        try {
            const newExam = await prisma.exam.create({
                data: {
                    name: q.examName,
                    slug: slug,
                    categoryId: catId,
                    status: 'PUBLISHED'
                }
            });
            examId = newExam.id;
            examMap.set(q.examName.toLowerCase(), examId);
            console.log(`➕ Created Exam: ${q.examName}`);
        } catch (e) { console.error(e.message); return; }
    }

    // 2. Create Question (Explicit Relation)
    try {
        const question = await prisma.question.create({
            data: {
                questionText: q.text,
                questionType: 'MCQ_SINGLE',
                options: q.options.map(o => ({ ...o, isCorrect: o.id === q.answer })),
                correctAnswer: q.answer,
                solution: q.explanation,
                subjectId: q.subjectId,
                difficulty: 'MEDIUM',
                status: 'PUBLISHED',
                createdById: userId
            }
        });

        await prisma.questionExam.create({
            data: {
                questionId: question.id,
                examId: examId
            }
        });
    } catch (e) { console.error(`Failed save: ${e.message}`); }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
