const https = require('https');
const url = 'https://testdone.in';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const h1Match = data.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        if (h1Match) {
            const h1Text = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            console.log(`VERIFIED H1: ${h1Text}`);
        } else {
            console.log("H1 NOT FOUND");
        }
    });
});
