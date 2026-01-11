
const API_URL = 'https://testdone.in/api/v1';
const EMAIL = 'admin@testdone.in';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const logError = (msg, err) => console.error(`[ERROR] ${msg}`, err);

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    // log(`Requesting: ${options.method || 'GET'} ${url}`);
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

        if (res.status === 204) return null;

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            logError(`Failed to parse JSON response from ${url}: ${text}`);
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }

        if (!res.ok) {
            throw new Error(data.message || data.error?.message || `Request failed: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        throw err;
    }
}

async function verify() {
    log(`Starting verification against ${API_URL}`);
    let token = '';

    try {
        log('Logging in...');
        const loginRes = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });
        token = loginRes.data?.accessToken;
        if (!token) throw new Error('No access token');
        log('Login successful');
    } catch (e) {
        logError('Login failed', e.message);
        process.exit(1);
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Subject
    let subjectId;
    try {
        log('Fetching subjects...');
        const subRes = await request('/subjects', { headers: authHeaders }); // Assuming GET /subjects works for auth user or public
        if (!subRes.data || subRes.data.length === 0) throw new Error('No subjects found');
        subjectId = subRes.data[0].id;
        log(`Using Subject: ${subRes.data[0].name} (${subjectId})`);
    } catch (e) {
        logError('Subject fetch failed', e.message);
        process.exit(1);
    }

    // 3. Category
    let categoryId;
    try {
        log('Fetching categories...');
        const catRes = await request('/exams/categories', { headers: authHeaders });
        // API returns data as array of categories
        const categories = Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories;

        if (!categories || categories.length === 0) throw new Error('No categories found');
        categoryId = categories[0].id;
        log(`Using Category: ${categories[0].name} (${categoryId})`);
    } catch (e) {
        logError('Category fetch failed', e.message);
        process.exit(1);
    }

    // 4. Create Exam
    let examId;
    try {
        log('Creating Exam...');
        const examSlug = `test-exam-${Date.now()}`;
        const examRes = await request('/admin/exams', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Debug Exam',
                slug: examSlug,
                status: 'DRAFT',
                categoryId: categoryId,
                description: 'Debug Verification Exam'
            })
        });
        examId = examRes.data.id;
        log(`Exam Created: ${examId}`);
    } catch (e) {
        logError('Exam creation failed', e.message);
        process.exit(1);
    }

    // 5. Cleanup Exam
    try {
        log(`Deleting Exam ${examId}...`);
        await request(`/admin/exams/${examId}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        log('Exam Deleted');
    } catch (e) {
        logError('Exam deletion failed', e.message);
    }

    log('VERIFICATION COMPLETE');
}

verify();
