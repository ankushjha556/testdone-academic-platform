
const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function test() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'admin@testdone.in',
            password: 'Admin@123456'
        });

        if (loginRes.status !== 200) {
            console.error("Login Failed:", loginRes.status, loginRes.data);
            return;
        }

        const token = loginRes.data.data.accessToken;
        console.log("Logged in. Token acquired.");

        // 2. Create Question
        console.log("Creating Question...");
        const payload = {
            questionText: "Native HTTP Verification - Multi Exam",
            questionType: "MCQ_SINGLE",
            difficulty: "MEDIUM",
            marks: 1,
            negativeMarks: 0.25,
            subjectId: "e9cbda9d-7db3-43c3-b30f-4886bca9f635",
            examIds: ["45d35a06-6b6c-44a7-a6c5-717901ff95f2", "e4b468ce-610c-44de-b419-05c910a44cc1"],
            status: "PUBLISHED",
            options: [
                { id: "A", text: "Opt A", isCorrect: false },
                { id: "B", text: "Opt B", isCorrect: true }
            ],
            solution: "Solution via Native HTTP"
        };

        const createRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/v1/admin/questions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, payload);

        console.log("Create Response Status:", createRes.status);
        console.log("Create Response Data:", JSON.stringify(createRes.data, null, 2));

        if (createRes.status === 201) {
            console.log("SUCCESS: Question created.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
