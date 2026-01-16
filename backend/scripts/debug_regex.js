const fs = require('fs');
const path = require('path');

const batchFilePath = path.join(__dirname, '../questions_batch2_formatted_complete.txt');
const content = fs.readFileSync(batchFilePath, 'utf-8');
const lines = content.split('\n');

console.log('--- DEBUG PARSING ---');

for (let i = 0; i < 50; i++) {
    const line = lines[i].trim();
    if (line.startsWith('### Q')) {
        console.log(`\nLine: "${line}"`);

        const innerMatch = line.match(/\((.*?)\)/);
        if (innerMatch) {
            const inner = innerMatch[1];
            console.log(`Inner: "${inner}"`);
            console.log(`Hex: ${Buffer.from(inner).toString('hex')}`);

            // Check individual chars
            for (let j = 0; j < inner.length; j++) {
                const code = inner.charCodeAt(j);
                if (code > 127) {
                    console.log(`Char at ${j}: ${inner[j]} (Code: ${code}, Hex: ${code.toString(16)})`);
                }
            }

            const parts = inner.split(/(?:\u2013|\u2014|â€“|-)/);
            console.log(`Split Parts:`, parts);
        }
    }
}
