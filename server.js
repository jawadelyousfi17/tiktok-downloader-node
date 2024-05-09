const express = require('express');
const puppeteer = require('puppeteer-extra');
const path = require('path');
const cors = require('cors');

require('dotenv').config()

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000; // You can change the port if needed

// Middleware to parse incoming JSON data
app.use(express.json())
app.use('/video', express.static(path.join(__dirname, 'video')));


app.use(cors({
  origin: 'http://localhost:5173'
})); // This will enable CORS for all routes and all origins

const videoData = {}

const { getUserData, getVideo, getImages, getVideo2, getImages2 } = require('./app')

let browser, page;
(async () => {
  browser = await puppeteer.launch({
    headless: false
  });
})()

// POST request handler
app.post('/user-data', async (req, res) => {
  const data = req.body;
  try {
    const userData = await getUserData(req.body.userName, page)
    res.status(200).json({ succes: true, data: userData });
    return
  } catch (error) {
    console.log(error.message)
    return res.json({ succes: false })
  }
});

app.post('/video', async (req, res) => {
  const { url } = req.body;
  console.log(req.body)
  const regex = /\/video\/(\d+)/;
  const photoRegex = /\/photo\/(\d+)/;
  const hashtagRegex = /#\p{L}+/gu; // Matches #word combinations
  const match = url.match(regex);
  if (true) {
    getVideo(url, browser,
      (path, images) => {
        videoData[path] = images.alt.replace(hashtagRegex, '')
        console.log(videoData)
        res.json({ succes: true, type: 'video', path: path, images })
      },
      () => {
        res.json({ succes: false, type: 'server' })
      })
  }
  if (url.match(photoRegex)) {
    getImages(url, browser)
      .then((data) => {
        res.json({ succes: true, type: 'images', data })
      })
      .catch(err => {
        console.log(err.message)
        res.json({ succes: false, type: 'server' })
      })
  }
  if(!url.match(photoRegex) && !match) {
    res.json({succes : false , type : 'link' })
  }
});

app.post('/beta', async (req, res) => {
  const { url } = req.body;

  const page = await browser.newPage();
  // const videoUrl = `https://www.tiktok.com/@ltsmikaylacampinos/video/7345297913788091690`
  await page.goto(url , { waitUntil: 'networkidle2' });
  const currentURL = page.url();
  const regex = /\/video\/(\d+)/;
  const photoRegex = /\/photo\/(\d+)/;
  const hashtagRegex = /#\p{L}+/gu; // Matches #word combinations
  const match = currentURL.match(regex);


  if(match) {
    console.log('video')
    getVideo2(url, browser, page ,
      (path, images) => {
        videoData[path] = images.alt.replace(hashtagRegex, '')
        res.json({ succes: true, type: 'video', path: path, images })
      },
      () => {
        res.json({ succes: false, type: 'server' })
      })
  }
  if (currentURL.match(photoRegex)) {
    console.log('image')
    getImages2(url, browser , page)
      .then((data) => {
        res.json({ succes: true, type: 'images', data })
      })
      .catch(err => {
        console.log(err.message)
        res.json({ succes: false, type: 'server' })
      })
  }
 
  if(!match && !currentURL.match(photoRegex)) {
    res.json({succes : false , type : 'link' })
  }

})


app.get('/download/:id', (req, res) => {
  const id = req.params.id
  console.log(id)
  const filePath = path.join(__dirname, 'video', `${id}.mp4`); // adjust the path and file name
  const fileName = `${videoData[id]}.mp4`; // This will be the name of the downloaded file
  res.download(filePath, fileName, (err) => {
    if (err) {
      // Handle error, but don't expose too much to the client
      console.error("Error downloading file:", err);
      if (!res.headersSent) {
        res.status(500).send("Error downloading the file");
      }
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
