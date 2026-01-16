
const fs = require('fs');
const path = require('path');
const { PrismaClient, Difficulty, ContentStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Data Source
const SOURCE_FILE = path.join(__dirname, '../questions_batch2_formatted_complete.txt');

// Regex Patterns
// ### Q1. (SSC CHSL– Analogy)
// Note: The dash might be a hyphen -, en-dash –, or em-dash —. Regex tries to catch all.
const HEADER_REGEX = /### Q\d+\.\s*\((.*?)[-–—]\s*(.*?)\)/;

async function main() {
    console.log("🚀 Starting Batch 2 Seeding...");

    // 1. Load Data
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Source file not found: ${SOURCE_FILE}`);
        return;
    }
    const rawText = fs.readFileSync(SOURCE_FILE, 'utf-8');

    // 2. Pre-fetch Metadata (Exams, Subjects, Topics)
    const exams = await prisma.exam.findMany();
    const subjects = await prisma.subject.findMany(); // We might need to map Topic -> Subject purely by guessing or standard map
    const topics = await prisma.topic.findMany({ include: { subject: true } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin@testdone.in' } });

    if (!admin) {
        throw new Error("Admin user not found for createdById");
    }

    // Map: Slug -> ID
    const examMap = new Map(exams.map(e => [e.slug, e.id]));
    const topicMap = new Map(topics.map(t => [t.slug, t.id]));
    // Wait, topics in file are Names (e.g. "Analogy"). Map Name -> Topic Object
    const topicNameMap = new Map(topics.map(t => [t.name.toLowerCase(), t]));

    // Helper to find/create exam
    // File uses names like "SSC CHSL", "RRB JE". We match these to our slugs.
    // "SSC CHSL" -> ssc-chsl
    // "RRB JE" -> rrb-je (if exists) or railway? 
    // Use heuristic: normalize string

    function findExamId(examName) {
        const normalized = examName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        // Check exact slug
        if (examMap.has(normalized)) return examMap.get(normalized);

        // Check name match
        const found = exams.find(e => e.name.toLowerCase() === examName.toLowerCase());
        if (found) return found.id;

        // Heuristic: "SSC CHSL" -> "ssc-chsl"
        // "UPSC CAPF" -> "upsc-capf" (Do we have this? If not, fallback or skip?)
        // Let's print warning if not found
        //console.warn(`Warn: Exam '${examName}' not matched exactly.`);

        // Try fuzzy
        const fuzzy = exams.find(e => e.name.toLowerCase().includes(examName.toLowerCase().split(' ')[0]));
        return fuzzy ? fuzzy.id : null;
    }

    // Helper to find/create topic
    // If topic "Analogy" exists, return ID. If not, create under a default subject?
    // We need subject. Topic -> Subject mapping is implied.
    // Default subject: "General Awareness" if unknown? Or "Reasoning"?
    // "Reasoning" topics: Analogy, Blood Relations...
    // "Quant": Number Series...
    // "English": ...

    async function getTopic(topicName) {
        const key = topicName.toLowerCase().trim();
        if (topicNameMap.has(key)) return topicNameMap.get(key);

        // Heuristic for Subject based on Topic Name (Basic Keyword Search)
        let subjectSlug = 'general-awareness'; // Default
        const t = topicName.toLowerCase();

        if (t.includes('analogy') || t.includes('series') || t.includes('coding') || t.includes('reasoning') || t.includes('puzzle') || t.includes('blood') || t.includes('syllogism')) subjectSlug = 'reasoning';
        else if (t.includes('number') || t.includes('interest') || t.includes('math') || t.includes('cube')) subjectSlug = 'quantitative-aptitude';
        else if (t.includes('history') || t.includes('polity') || t.includes('geography') || t.includes('science') || t.includes('current') || t.includes('gk')) subjectSlug = 'general-awareness';
        else if (t.includes('english') || t.includes('grammar') || t.includes('comprehension')) subjectSlug = 'english';

        const subject = subjects.find(s => s.slug === subjectSlug) || subjects[0];

        // Create Topic
        console.log(`Creating new topic: ${topicName} in ${subjectSlug}`);
        const newTopic = await prisma.topic.create({
            data: {
                name: topicName,
                slug: topicName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                subjectId: subject.id,
                order: 99
            }
        });

        topicNameMap.set(key, newTopic);
        return newTopic;
    }

    // 3. Parse Questions
    const chunks = rawText.split('---').map(c => c.trim()).filter(c => c);
    let count = 0;

    for (const chunk of chunks) {
        // Parse Header
        const headerMatch = chunk.match(HEADER_REGEX);
        if (!headerMatch) continue;

        const examName = headerMatch[1].trim();
        const topicName = headerMatch[2].trim();

        // Extract Question Text & Options
        // Text is between Header and "A."
        const questionTextMatch = chunk.match(/\)\n([\s\S]*?)\nA\./);
        if (!questionTextMatch) continue;
        let questionText = questionTextMatch[1].trim();

        // Extract Options
        const optionA = chunk.match(/A\.\s*(.*?)\n/)?.[1]?.trim() || "";
        const optionB = chunk.match(/B\.\s*(.*?)\n/)?.[1]?.trim() || "";
        const optionC = chunk.match(/C\.\s*(.*?)\n/)?.[1]?.trim() || "";
        const optionD = chunk.match(/D\.\s*(.*?)\n/)?.[1]?.trim() || "";

        // Answer & Explanation
        const ansMatch = chunk.match(/\*\*Answer:\*\*\s*([A-D])\.?/);
        const explMatch = chunk.match(/\*\*Explanation:\*\*\s*([\s\S]*?)$/);

        if (!ansMatch) continue;

        const correctLetter = ansMatch[1];
        const solution = explMatch ? explMatch[1].trim() : "";

        // Resolve Entities
        const examId = findExamId(examName);
        const topic = await getTopic(topicName);

        if (!examId) {
            console.log(`Skipping Q (Exam not found): ${examName}`);
            continue; // OR Default to a fallback exam?
        }

        // Check duplicate
        const exists = await prisma.question.findFirst({
            where: { questionText: questionText }
        });

        if (exists) {
            // Check if link exists
            const link = await prisma.questionExam.findFirst({
                where: {
                    questionId: exists.id,
                    examId: examId
                }
            });

            if (!link) {
                console.log(`Linking existing Q to duplicate exam: ${examName}`);
                await prisma.questionExam.create({
                    data: {
                        questionId: exists.id,
                        examId: examId
                    }
                });
                process.stdout.write('L');
            } else {
                process.stdout.write('s');
            }
            continue;
        }

        // Prepare Data
        const qData = {
            questionText,
            questionType: 'MCQ_SINGLE', // Enum
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            negativeMarks: 0.25,
            subjectId: topic.subjectId,
            topicId: topic.id,
            status: ContentStatus.PUBLISHED,
            createdById: admin.id,
            solution: solution,
            options: [
                { id: "A", text: optionA, isCorrect: correctLetter === "A" },
                { id: "B", text: optionB, isCorrect: correctLetter === "B" },
                { id: "C", text: optionC, isCorrect: correctLetter === "C" },
                { id: "D", text: optionD, isCorrect: correctLetter === "D" }
            ],
            questionExams: {
                create: { examId: examId }
            }
        };

        // Insert
        await prisma.question.create({ data: qData });
        count++;
        process.stdout.write('.');
    }

    console.log(`\n\n✅ Successfully Seeded ${count} Questions!`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
