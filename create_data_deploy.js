
const fs = require('fs');
const path = require('path');

const file = 'backend/questions_batch2_formatted_complete.txt';
const remotePath = '/home/testdone/testdone/backend/questions_batch2_formatted_complete.txt';

const content = fs.readFileSync(file);
const b64 = content.toString('base64').match(/.{1,76}/g).join('\n');

const cmds = `
echo "Uploading Data File..."
cat <<EOF | base64 -d > ${remotePath}
${b64}
EOF
echo "Checking File..."
ls -l ${remotePath}
echo "Running Seed..."
cd /home/testdone/testdone/backend
npx tsx scripts/seed_questions.ts
npx tsx scripts/deduplicate_questions.ts
echo "SEED COMPLETE"
`;

fs.writeFileSync('deploy_cmds.txt', cmds);
console.log('Created deploy_cmds.txt for data');
