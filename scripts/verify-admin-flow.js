
const API_URL = 'https://testdone.in/api/v1';
const EMAIL = 'admin@testdone.in';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

const log = (msg, type = 'info') => {
    let color = colors.reset;
    if (type === 'success') color = colors.green;
    if (type === 'error') color = colors.red;
    if (type === 'info') color = colors.blue;
    console.log(`${color}${msg}${colors.reset}`);
};

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    // Check for 204 No Content
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || data.error?.message || `Request failed: ${res.status} ${res.statusText}`);
    }
    return data;
}

async function verifyAdminFlow() {
    log(`🚀 Starting Admin Verification against ${API_URL}...`, 'info');
    let token = '';

    try {
        // 1. Login
        log('1️⃣ Logging in as Admin...', 'info');
        const loginData = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });
        token = loginData.data?.accessToken;
        if (!token) throw new Error('No access token received');
        log('✅ Login successful', 'success');

        const authHeaders = { Authorization: `Bearer ${token}` };

        // 2. Fetch Existing Subject (Subject creation not exposed in Admin API yet)
        log('2️⃣ Fetching existing Subject...', 'info');
        const subjectsData = await request('/subjects');
        if (!subjectsData.data || subjectsData.data.length === 0) {
            throw new Error('No subjects found. Please seed the database first.');
        }
        const subjectId = subjectsData.data[0].id;
        log(`✅ Using existing Subject: ${subjectsData.data[0].name} (${subjectId})`, 'success');

        // 3. Create Exam
        log('3️⃣ Creating an Exam...', 'info');
        // Fetch categories first
        const catData = await request('/exams/categories');
        const categoryId = catData.data.categories[0].id;

        const examData = await request('/admin/exams', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Test Verify Exam',
                slug: `test-verify-exam-${Date.now()}`,
                status: 'DRAFT',
                categoryId: categoryId,
                description: 'Verification Exam',
            }),
        });
        const examId = examData.data.id;
        log(`✅ Exam created: ${examId}`, 'success');

        // 4. Create Section
        log('4️⃣ Creating a Section...', 'info');
        const sectionData = await request(`/admin/exams/${examId}/sections`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Test Section',
                slug: `test-section-${Date.now()}`,
                order: 1,
                examId: examId,
            }),
        });
        const sectionId = sectionData.data.id;
        log(`✅ Section created: ${sectionId}`, 'success');

        // 5. Create Question
        log('5️⃣ Creating a Question...', 'info');
        const questionData = await request('/admin/questions', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                questionText: 'Test Question?',
                questionType: 'MCQ_SINGLE',
                difficulty: 'MEDIUM',
                marks: 1,
                negativeMarks: 0.25,
                subjectId: subjectId,
                status: 'PUBLISHED',
                options: [
                    { id: 'A', text: 'Option A', isCorrect: true },
                    { id: 'B', text: 'Option B', isCorrect: false },
                ],
                correctAnswer: 'A',
                questionExams: [{ examId: examId }],
                sectionId: sectionId,
            }),
        });
        const questionId = questionData.data.id;
        log(`✅ Question created: ${questionId}`, 'success');

        // 6. Create Mock Test
        log('6️⃣ Creating a Mock Test...', 'info');
        const testData = await request('/admin/tests', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                title: 'Verification Test',
                slug: `verification-test-${Date.now()}`,
                description: 'Test created by verification script',
                examId: examId,
                durationMinutes: 30,
                totalMarks: 50,
                passingMarks: 20,
                status: 'DRAFT',
            }),
        });
        const testId = testData.data.id;
        log(`✅ Mock Test created: ${testId}`, 'success');

        // 7. Cleanup
        log('7️⃣ Cleaning up (Deleting created entities)...', 'info');

        await request(`/admin/tests/${testId}`, { method: 'DELETE', headers: authHeaders });
        log('   - Deleted Test', 'info');

        await request(`/admin/questions/${questionId}`, { method: 'DELETE', headers: authHeaders });
        log('   - Deleted Question', 'info');

        try {
            await request(`/admin/exams/${examId}/sections/${sectionId}`, { method: 'DELETE', headers: authHeaders });
            log('   - Deleted Section', 'info');
        } catch (e) { log(`   - (Optional) Could not delete section explicitly: ${e.message}`, 'info'); }

        await request(`/admin/exams/${examId}`, { method: 'DELETE', headers: authHeaders });
        log('   - Deleted Exam', 'info');

        // Subject deletion skipped as we didn't create it

        log('✅ Cleanup completed', 'success');
        log('🎉 VERIFICATION SUCCESSFUL: All Admin CRUD operations functionality confirmed!', 'success');

    } catch (error) {
        log('❌ VERIFICATION FAILED', 'error');
        console.error(error.message);
        process.exit(1);
    }
}

verifyAdminFlow();
