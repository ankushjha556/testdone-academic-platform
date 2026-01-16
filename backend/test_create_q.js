
const axios = require('axios');

async function test() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'admin@testdone.in',
            password: 'password123' // Try default
        });
        const token = loginRes.data.data.accessToken;
        console.log("Logged in. Token:", token.substring(0, 20) + "...");

        // 2. Create Question with Multi Exams
        console.log("Creating Question...");
        const payload = {
            questionText: "API Verification - Multi Exam",
            questionType: "MCQ_SINGLE",
            difficulty: "MEDIUM",
            marks: 1,
            negativeMarks: 0.25,
            subjectId: "e9cbda9d-7db3-43c3-b30f-4886bca9f635", // General Awareness (from previous logs)
            examIds: ["45d35a06-6b6c-44a7-a6c5-717901ff95f2", "e4b468ce-610c-44de-b419-05c910a44cc1"], // RRB & SSC
            status: "PUBLISHED",
            options: [
                { id: "A", text: "Opt A", isCorrect: false },
                { id: "B", text: "Opt B", isCorrect: true }
            ],
            solution: "Solution via API"
        };

        const createRes = await axios.post('http://localhost:5000/api/v1/admin/questions', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Create Status:", createRes.status);
        console.log("Question ID:", createRes.data.data.id);

        // 3. Verify
        console.log("Question Created. Run check_q_map.js to verify DB links.");

    } catch (e) {
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Error Message:", e.message);
        }
    }
}

test();
