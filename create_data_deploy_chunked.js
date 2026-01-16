
const fs = require('fs');
const path = require('path');

const file = 'backend/questions_batch2_formatted_complete.txt';
const remotePath = '/home/testdone/testdone/backend/questions_batch2_formatted_complete.txt';

const content = fs.readFileSync(file);
const b64 = content.toString('base64');
const chunks = b64.match(/.{1,1000}/g); // 1000 chars per chunk (~750 bytes)

let cmds = `
echo "Initializing Upload..."
> ${remotePath}
`;

for (const chunk of chunks) {
    cmds += `
echo -n "${chunk}" | base64 -d >> ${remotePath}
`;
}

cmds += `
echo "Upload Complete."
ls -l ${remotePath}
echo "Running Seed..."
cd /home/testdone/testdone/backend
npx tsx scripts/seed_questions.ts
npx tsx scripts/deduplicate_questions.ts
echo "SEED COMPLETE"
`;

fs.writeFileSync('deploy_cmds.txt', cmds);
console.log(`Created deploy_cmds.txt with ${chunks.length} chunks`);
