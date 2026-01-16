const https = require('https');
const url = 'https://testdone.in';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const index = data.indexOf("India's Smart");
        if (index !== -1) {
            console.log("FOUND KEYWORD!");
            console.log(data.substring(index - 100, index + 100));
        } else {
            console.log("KEYWORD 'India's Smart' NOT FOUND");
            // Dump title at least
            const titleMatch = data.match(/<title>(.*?)<\/title>/);
            console.log(`Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);
        }
    });
});
