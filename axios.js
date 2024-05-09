const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHTML(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching page: ', error.response.status);
        return null;
    }
}

(async ()=> {
    const html = await fetchHTML('https://www.tiktok.com/@muzic.break/video/7366288338828971297')
    const $ = cheerio.load(html);
    const divText = $('.tiktok-web-player video').html();
    console.log(html)
})()