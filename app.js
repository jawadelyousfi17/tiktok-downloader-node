const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Dummy = require('xdummy-js');



const getUserData = async (username, page) => {

    await page.goto(`https://www.tiktok.com/@${username}`);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');

    // setTimeout(async () => { await page.screenshot({ path: 'screenshot.png' });await browser.close();} , 2000)
    try {
        const userFollowers = await page.$$eval('.e1457k4r1', elements => {
            return elements.map(element => element.textContent);
        });

        const imageProfile = await page.$eval('.css-1mavlr4-UserContainer .css-1zpj2q-ImgAvatar', el => el.src);
        const userUserName = await page.$eval('.ekmpd5l3 h1', el => el.innerText);
        const userName = await page.$eval('.ekmpd5l3 h2', el => el.innerText);


        return { imageProfile, userName, userUserName, userFollowers: userFollowers[1].toLocaleLowerCase().split('f')[0] }

    } catch (error) {
        console.log(error.message)
        throw 'No user found'
    }
}



function getVideoId(url) {
    const regex = /\/video\/(\d+)/;
    const match = url.match(regex);

    if (match) {
        return videoId = match[1];
        console.log("Extracted video ID:", videoId);
    } else {
        console.error("Video ID not found in the URL");
    }
}




const download_file = async (url, ck, path, done) => {
    try {
        const writer = fs.createWriteStream(`./video/${path}.mp4`)
        const response = await axios({
            url,
            method: 'GET',
            headers: {
                'Cookie': ck,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
            },
            responseType: 'stream'
        })
        response.data.pipe(writer)
        setTimeout(() => {
            fs.unlink(`./video/${path}.mp4`, (err) => {
                if (err) {
                }
            });
        }, 30000)
        writer.on('finish', () => done());

    } catch (error) {
        throw error;
    }

}

function formatCookiesForAxios(cookieArray) {
    return cookieArray.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

const getVideo = async (videoUrl, browser, callback, errorCallback) => {
    try {
        //   const browser = await puppeteer.launch({
        //     headless: false,
        //     args: ['--lang=en-US']
        // });
        const page = await browser.newPage();
        // const videoUrl = `https://www.tiktok.com/@ltsmikaylacampinos/video/7345297913788091690`
        await page.goto(videoUrl);
        const videoSrc = await page.$eval('.tiktok-web-player video', el => el.src);
        const images = await page.$$eval('picture img', elements => {
            return elements.map(element => ({ src: element.src, alt: element.alt }));
        });
        console.log(images)
        var viewSource = await page.goto(videoSrc, { waitUntil: 'networkidle2' });
        const cookies = await page.cookies();
        const cookieHeader = formatCookiesForAxios(cookies);
        const videoId = Dummy.uniqueId(12)
        download_file(videoSrc, cookieHeader, videoId, () => callback(videoId, images[1]))
        page.close()
    } catch (error) {
        console.log('here')
        errorCallback()
    }
}

const getImages = async (url , browser) => {
   
    try {
     const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const imgSrcs = await page.evaluate(() => {
        const swipeDiv = document.querySelector('.swiper-wrapper');
        const imageDivs = swipeDiv.querySelectorAll('div img');
        return Array.from(imageDivs).map(img => img.src);
    })
    // const title = await page.$eval('.css-1wdx3tj-DivContainer span ', el => el.textContent) || await page.$eval('.css-199fttw-H1PhotoTitle', el => el.textContent) || 'hi'
    const metaContent = await page.$eval('meta[property="og:description"]', element => element.content);

    const numberOfImages = imgSrcs.length / 3
    const images = []
    for (let index = 0; index < numberOfImages; index++) {
        images.push(imgSrcs[index])
    }
    page.close()
    return {images , title : metaContent }   
    } catch (error) {
        console.log(error.message)
        throw 'error'
    }
}


module.exports = { getUserData, getVideo , getImages }




