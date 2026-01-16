const https = require('https');

const BASE_URL = 'https://testdone.in';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function verify() {
    console.log("--- STARTING VERIFICATION ---");

    // 1. Verify Homepage
    console.log(`\nChecking Homepage: ${BASE_URL}`);
    const homeHtml = await fetchUrl(BASE_URL);
    const homeTitle = homeHtml.match(/<title>(.*?)<\/title>/)?.[1];
    console.log(`Homepage Title: "${homeTitle}"`);
    if (homeTitle && !homeTitle.includes("India's #1")) {
        console.log("PASS: Homepage Title corrected.");
    } else {
        console.log("FAIL: Homepage Title still contains forbidden text or not found.");
    }

    // 2. Find an Exam URL
    // We can try a known slug or extract from homepage/exams
    // Let's try to extract from homepage "View All Exams" or similar links
    // Or just try a common one like /exams/ssc-chs-tier-1-2024 or whatever exists
    // Let's first fetch /exams to find a link
    console.log(`\nFetching /exams to find a valid exam link...`);
    const examsHtml = await fetchUrl(`${BASE_URL}/exams`);
    const examLinkMatch = examsHtml.match(/href=["']\/exams\/([^"']+)["']/);

    if (examLinkMatch) {
        const examSlug = examLinkMatch[1];
        const examUrl = `${BASE_URL}/exams/${examSlug}`;
        console.log(`Found Exam Slug: ${examSlug}`);
        console.log(`Checking Exam Page: ${examUrl}`);

        const examHtml = await fetchUrl(examUrl);
        const examTitle = examHtml.match(/<title>(.*?)<\/title>/)?.[1];
        const examDesc = examHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/)?.[1];

        console.log(`Exam Title: "${examTitle}"`);
        console.log(`Exam Desc:  "${examDesc}"`);

        if (examTitle && examTitle.includes("TestDone")) {
            console.log("PASS: Exam Dynamic Title looks valid.");
        } else {
            console.log("FAIL: Exam Title missing or invalid.");
        }

        // 3. Find a Test URL from Exam Page
        const testLinkMatch = examHtml.match(/href=["']\/tests\/([^"']+)["']/);
        if (testLinkMatch) {
            const testSlug = testLinkMatch[1];
            const testUrl = `${BASE_URL}/tests/${testSlug}`;
            console.log(`\nFound Test Slug: ${testSlug}`);
            console.log(`Checking Test Page: ${testUrl}`);

            const testHtml = await fetchUrl(testUrl);
            const testTitle = testHtml.match(/<title>(.*?)<\/title>/)?.[1];
            const testRobots = testHtml.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/)?.[1];

            console.log(`Test Title: "${testTitle}"`);
            console.log(`Test Robots: "${testRobots || 'INDEX (Default)'}"`);
        } else {
            console.log("WARN: No Test links found on Exam Page.");
        }

    } else {
        console.log("FAIL: Could not find any exam links on /exams page.");
        console.log(examsHtml.substring(0, 500)); // Debug
    }
}

verify();
