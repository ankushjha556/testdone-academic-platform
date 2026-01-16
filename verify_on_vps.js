const http = require('http');

function check(url) {
    http.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const title = data.match(/<title>(.*?)<\/title>/)?.[1];
            console.log(`URL: ${url}`);
            console.log(`Title: ${title}`);
            if (title && !title.includes("India's #1")) {
                console.log("STATUS: PASS (New Title Detected)");
            } else {
                console.log("STATUS: FAIL (Old Title Detected or None)");
            }
        });
    }).on('error', e => console.log(e.message));
}

check('http://localhost:3000');
