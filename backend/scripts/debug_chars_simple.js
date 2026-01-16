const fs = require('fs');
const path = require('path');

const batchFilePath = path.join(__dirname, '../questions_batch2_formatted_complete.txt');
const content = fs.readFileSync(batchFilePath, 'utf-8');
const lines = content.split('\n');

const outDir = path.join(__dirname, 'debug_chars_output.txt');
fs.writeFileSync(outDir, '');

function log(msg) {
    fs.appendFileSync(outDir, msg + '\n');
}

log('--- DEBUG CHAR REVEAL ---');

for (let i = 0; i < 50; i++) {
    const line = lines[i].trim();
    if (line.match(/### Q\d+\./)) {
        log(`\nLine Found: "${line}"`);

        log('Line Char Codes:');
        for (let j = 0; j < Math.min(line.length, 50); j++) {
            log(`[${j}] ${line[j]} : ${line.charCodeAt(j)} (0x${line.charCodeAt(j).toString(16)})`);
        }

        const innerMatch = line.match(/\((.*?)\)/);
        if (innerMatch) {
            const inner = innerMatch[1];
            log(`Inner Raw: "${inner}"`);

            const str = inner.trim();
            log('Char Codes:');
            for (let j = 0; j < str.length; j++) {
                log(`[${j}] ${str[j]} : ${str.charCodeAt(j)} (0x${str.charCodeAt(j).toString(16)})`);
            }
        }
        break;
    }
}
