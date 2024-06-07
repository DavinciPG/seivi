const cheerio = require('cheerio');
const path = require('path');

const { Cluster } = require('puppeteer-cluster');

const chromiumPath = path.join(__dirname, '../../drivers/', 'chrome-linux', 'chrome');

const default_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Ch-Ua-Platform': 'Windows'
}

class BrowserController {
    constructor() {
        this.cluster = null;

        this.InitializeBrowser = this.InitializeBrowser.bind(this);
        this.CloseBrowser = this.CloseBrowser.bind(this);
        this.GetPageContent = this.GetPageContent.bind(this);
    }

    async InitializeBrowser() {
        try {
            this.cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_PAGE,
                maxConcurrency: 100,
                puppeteerOptions: {
                    headless: true,
                    executablePath: chromiumPath,
                    args: [
                        '--incognito',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-background-networking',
                        '--disable-default-apps',
                        '--disable-extensions',
                        '--disable-sync',
                        '--disable-translate',
                        '--disable-blink-features=AutomationControlled',
                        '--mute-audio',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-breakpad',
                        '--disable-component-extensions-with-background-pages',
                        '--disable-ipc-flooding-protection',
                        '--disable-renderer-backgrounding',
                        '--force-color-profile=srgb',
                        '--window-size=800,600'
                    ],
                    defaultViewport: {
                        width: 800,
                        height: 600
                    }
                },
            });

            this.cluster.on('taskerror', (err, data) => {
                console.error(`Error crawling ${data}: ${err.message}`);
            });

            await this.cluster.task(async ({ page, data: { url, resolve } }) => {
                const start = Date.now();

                await page.setExtraHTTPHeaders(default_headers);
                await page.setJavaScriptEnabled(false);

                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font', 'media', 'script'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });
                const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
                const statusCode = response.status();
                const pageContent = await page.content();

                const end = Date.now();
                const loadTime = end - start;

                resolve({ link: url, statusCode, pageContent, loadTime });
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async CloseBrowser() {
        try {
            if (this.cluster) {
                await this.cluster.idle();
                await this.cluster.close();
                this.cluster = null;
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async GetPageContent(url, headers = default_headers) {
        if(!this.cluster)
            await this.InitializeBrowser();

        return new Promise((resolve, reject) => {
            try {
                this.cluster.queue({ url, resolve });
            } catch (error) {
                reject(new Error(error.message));
            }
        });
    }

    async GetData(content) {
        try {
            return cheerio.load(content);
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = new BrowserController();