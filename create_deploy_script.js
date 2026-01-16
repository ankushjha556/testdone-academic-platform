
const fs = require('fs');
const path = require('path');

const files = [
    {
        local: 'frontend/src/app/questions/page.tsx',
        remote: '/home/testdone/testdone/frontend/src/app/questions/page.tsx'
    },
    {
        local: 'backend/src/routes/question.routes.ts',
        remote: '/home/testdone/testdone/backend/src/routes/question.routes.ts'
    },
    {
        local: 'backend/scripts/deduplicate_questions.ts',
        remote: '/home/testdone/testdone/backend/scripts/deduplicate_questions.ts'
    },
    {
        local: 'backend/scripts/fix_question_status.ts',
        remote: '/home/testdone/testdone/backend/scripts/fix_question_status.ts'
    },
    {
        local: 'backend/scripts/seed_questions.ts',
        remote: '/home/testdone/testdone/backend/scripts/seed_questions.ts'
    }
];

console.log('echo "STARTING MANUAL UPLOAD"');

files.forEach(f => {
    try {
        const content = fs.readFileSync(f.local);
        const b64 = content.toString('base64').match(/.{1,76}/g).join('\n');
        console.log(`echo "Uploading ${f.local}..."`);
        console.log(`cat <<EOF | base64 -d > ${f.remote}`);
        console.log(b64);
        console.log('EOF');
    } catch (e) {
        console.error(`Error reading ${f.local}: ${e}`);
    }
});

console.log('echo "UPLOAD COMPLETE"');
console.log('cd /home/testdone/testdone/backend');
console.log('npx ts-node --transpile-only scripts/fix_question_status.ts');
console.log('npx ts-node --transpile-only scripts/deduplicate_questions.ts');
console.log('pm2 restart testdone-backend');
console.log('cd ../frontend');
console.log('rm -rf .next');
console.log('npm run build');
console.log('pm2 restart testdone-frontend');
console.log('echo "MANUAL DEPLOY FINISHED"');
