
const fs = require('fs');
const path = require('path');

const file = 'backend/scripts/seed_questions.ts';
const remotePath = '/home/testdone/testdone/backend/scripts/seed_questions.ts';
const remoteDir = '/home/testdone/testdone/backend/scripts';

const content = fs.readFileSync(file);
const b64 = content.toString('base64').match(/.{1,76}/g).join('\n');

const cmds = `
echo "Creating Directory..."
mkdir -p ${remoteDir}
echo "Uploading Seed Script..."
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
console.log('Created deploy_cmds.txt with mkdir');
