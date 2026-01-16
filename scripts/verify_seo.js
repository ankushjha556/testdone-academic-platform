const https = require('https');

const url = 'https://testdone.in';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const titleMatch = data.match(/<title>(.*?)<\/title>/);
        const h1Match = data.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        const metaDescMatch = data.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);

        console.log("--- SEO VERIFICATION ---");
        console.log(`Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);

        let h1Text = 'NOT FOUND';
        if (h1Match) {
            h1Text = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        }
        console.log(`H1 (Clean): ${h1Text}`);

        console.log(`Meta Description: ${metaDescMatch ? metaDescMatch[1] : 'NOT FOUND'}`);

        if (data.includes("Why Choose TestDone")) {
            console.log("Content Check: 'Why Choose TestDone' section FOUND.");
        } else {
            console.log("Content Check: 'Why Choose TestDone' section NOT FOUND.");
        }
    });

}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
