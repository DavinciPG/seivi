const cheerio = require('cheerio');
const path = require('path');

const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUaPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const BlockResourcesPlugin = require('puppeteer-extra-plugin-block-resources');

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUaPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(BlockResourcesPlugin({
    blockedTypes: new Set(['image', 'stylesheet', 'font', 'media'])
}));

const chromiumPath = path.join(__dirname, '../../drivers/', 'chrome-linux', 'chrome');

const default_headers = {
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
                puppeteer,
                puppeteerOptions: {
                    headless: true,
                    executablePath: chromiumPath,
                    args: [
                        '--incognito',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-application-cache',
                        '--disk-cache-dir=/dev/null',
                        '--disable-dev-shm-usage',
                        '--disable-software-rasterizer',
                        '--disable-gl-drawing-for-tests',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-default-apps',
                        '--disable-extensions',
                        '--disable-sync',
                        '--disable-translate',
                        '--disable-blink-features=AutomationControlled',
                        '--mute-audio',
                        '--disable-background-networking',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
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
                monitor: true,
                retryLimit: 2
            });

            this.cluster.on('taskerror', (err, data) => {
                console.error(`Error crawling ${data}: ${err.message}`);
            });

            await this.cluster.task(async ({ page, data: { url, resolve } }) => {
                try {
                    const start = Date.now();

                    await page.setExtraHTTPHeaders(default_headers);
                    await page.setJavaScriptEnabled(false);

                    const response = await page.goto(url, {waitUntil: 'domcontentloaded'});

                    const statusCode = response.status();
                    const pageContent = await page.content();

                    const end = new Date.now();
                    const loadTime = end - start;

                    resolve({link: url, statusCode, pageContent, loadTime});
                }
                catch(error) {

                } finally {
                    await page.close();
                }
            });
        } catch (error) {
            console.error('Error initializing browser:', error);
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
            console.error('Error closing browser:', error);
        }
    }

    async GetPageContent(url, headers = default_headers) {
        if (!this.cluster)
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