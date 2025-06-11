const express = require('express');
const { firefox } = require('playwright');

const { log } = require('./log')

const app = express();
const PORT = 5600;

// Function to get first .m3u8 request
async function getFirstM3U8Request(url) {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  return new Promise(async (resolve, reject) => {
    try {
      page.on('request', (request) => {
        const requestUrl = request.url();
        if (requestUrl.includes('.m3u8')) {
          log(`Found .m3u8 request!`);
          resolve(requestUrl);
          browser.close();
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      await page.waitForTimeout(10000);

      reject('No .m3u8 request found within the timeout period.');
      await browser.close();
    } catch (error) {
      await browser.close();
      reject(error);
    }
  });
}

// Route handler
app.get('/api/v1/:text', async (req, res) => {
  const { text } = req.params;
  const targetUrl = `https://player.kick.com/${text}`;

  log(`Fetching .m3u8 for: ${targetUrl}`);

  try {
    const m3u8Url = await getFirstM3U8Request(targetUrl);
    res.json({ m3u8Url });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Start server
app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`);
});