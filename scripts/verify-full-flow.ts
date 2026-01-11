
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'https://testdone.in/api/v1';

// Helper
const assert = (condition: boolean, msg: string) => {
    if (condition) console.log(`✅ PASS: ${msg}`);
    else {
        console.error(`❌ FAIL: ${msg}`);
        process.exit(1);
    }
};

async function run() {
    console.log(`🚀 Starting Full E2E Security Verification against ${API_URL}...`);

    let adminToken: string;
    let subjectId: string;
    let questionId: string;
    let testId: string;
    let bookId: string;

    const email = process.env.ADMIN_EMAIL || 'admin@testdone.in';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        adminToken = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${adminToken}` };
        console.log('   Login successful');

        // 2. Admin CRUD (Questions) - Zod Check
        console.log('2. Creating Subject & Question (Zod check)...');
        // Create Subject
        let subRes = await axios.get(`${API_URL}/admin/subjects`, { headers });
        if (subRes.data.data.length === 0) {
            subRes = await axios.post(`${API_URL}/admin/subjects`, { name: `Sub-${Date.now()}`, slug: `sub-${Date.now()}` }, { headers });
            subjectId = subRes.data.data.id;
        } else {
            subjectId = subRes.data.data[0].id;
        }

        // Create Question (Fail Case: Marks)
        try {
            await axios.post(`${API_URL}/admin/questions`, {
                questionText: 'Bad Payload', subjectId, marks: 5
            }, { headers });
            console.warn('⚠️  Warning: Bad Payload did not throw error. Zod might allow stripping.');
        } catch (e: any) {
            if (e.response && e.response.status === 400) {
                console.log('   ✅ Validated: Bad Payload rejected (or field stripped verified logic needed)');
            }
        }

        // Create Valid Question
        const qRes = await axios.post(`${API_URL}/admin/questions`, {
            questionText: 'E2E Valid Question',
            questionType: 'MCQ_SINGLE',
            options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
            subjectId,
            difficulty: 'EASY'
        }, { headers });
        questionId = qRes.data.data.id;
        assert(!!questionId, 'Question Created');

        // 3. Admin CRUD (Test) - Type Coercion
        console.log('3. Creating Test (String number coercion)...');
        // Need exam
        const examRes = await axios.get(`${API_URL}/admin/exams`, { headers });
        let examId;
        if (!examRes.data.data.exams || examRes.data.data.exams.length === 0) {
            const catRes = await axios.get(`${API_URL}/admin/exam-categories`, { headers }).catch(() => ({ data: { data: [] } }));
            if (catRes.data.data.length > 0) {
                const newExam = await axios.post(`${API_URL}/admin/exams`, {
                    name: 'Test Exam', slug: `exam-${Date.now()}`, categoryId: catRes.data.data[0].id
                }, { headers });
                examId = newExam.data.data.id;
            }
        } else {
            examId = examRes.data.data.exams[0].id;
        }

        if (examId) {
            const testRes = await axios.post(`${API_URL}/admin/tests`, {
                name: 'E2E Test',
                slug: `test-${Date.now()}`,
                testType: 'FULL_LENGTH',
                totalQuestions: "10",
                totalMarks: "100",
                durationMinutes: "60",
                passingPercent: 40,
                examId
            }, { headers });
            testId = testRes.data.data.id;
            assert(Number(testRes.data.data.durationMinutes) === 60, 'Duration coerced to Number');
        } else {
            console.warn('   Skipping Test creation (No Exam found)');
        }

        // 4. Secure Download Ticket
        console.log('4. Testing Download Ticket...');
        const books = await axios.get(`${API_URL}/books`, { headers });
        if (books.data.data.books && books.data.data.books.length > 0) {
            bookId = books.data.data.books[0].id; // Use first book

            // Get Ticket
            const ticketRes = await axios.post(`${API_URL}/books/${bookId}/download-ticket`, {}, { headers });
            const ticket = ticketRes.data.data.ticket;
            assert(!!ticket, 'Ticket received');

            // Download with Ticket (No Auth Header)
            const dlRes = await axios.get(`${API_URL}/books/${bookId}/download?ticket=${ticket}`, {
                responseType: 'stream'
            });
            assert(dlRes.status === 200, 'Download success');
            assert(dlRes.headers['content-disposition'].includes('.pdf'), 'Content-Disposition has .pdf');

            // Try reuse ticket (Should Fail)
            try {
                await axios.get(`${API_URL}/books/${bookId}/download?ticket=${ticket}`);
                assert(false, 'Ticket reuse should fail');
            } catch (e: any) {
                assert(e.response?.status === 403, 'Ticket reuse blocked (403)');
            }
        } else {
            console.warn('Skipping download test (no books)');
        }

        // 5. Cleanup
        console.log('5. Cleaning up...');
        if (testId) await axios.delete(`${API_URL}/admin/tests/${testId}`, { headers });
        if (questionId) await axios.delete(`${API_URL}/admin/questions/${questionId}`, { headers });
        console.log('✅ Cleanup successful');

        console.log('🎉 ALL SYSTEMS GO');

    } catch (error: any) {
        console.error('❌ FAILURE:', error.response?.data || error.message);
        process.exit(1);
    }
}

run();
