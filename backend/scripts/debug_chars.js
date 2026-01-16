const fs = require('fs');
const path = require('path');

const batchFilePath = path.join(__dirname, '../questions_batch2_formatted_complete.txt');
const content = fs.readFileSync(batchFilePath, 'utf-8');
const lines = content.split('\n');

console.log = function (msg) { fs.appendFileSync(path.join(__dirname, 'debug_output.txt'), msg + '\n'); };
fs.writeFileSync(path.join(__dirname, 'debug_output.txt'), ''); // Clear file

console.log('--- DEBUG CHAR REVEAL ---');

for (let i = 0; i < 50; i++) {
    const line = lines[i].trim();
    if (line.match(/### Q\d+\./)) {
        console.log(`\nLine Found: "${line}"`);
        const innerMatch = line.match(/\((.*?)\)/);
        if (innerMatch) {
            const inner = innerMatch[1];
            console.log(`Inner Raw: "${inner}"`);
            console.log(`Inner Trimmed: "${inner.trim()}"`);

            const str = inner.trim();
            console.log('Char Codes:');
            for (let j = 0; j < Math.min(str.length, 20); j++) {
                console.log(`[${j}] ${str[j]} : ${str.charCodeAt(j)} (0x${str.charCodeAt(j).toString(16)})`);
            }

            if (inner.trim().toLowerCase().startsWith('ssc chsl')) {
                console.log("✅ STARTS WITH ssc chsl");
            } else {
                console.log("❌ DOES NOT START WITH ssc chsl");
            }
        }
        break;
    }
}
