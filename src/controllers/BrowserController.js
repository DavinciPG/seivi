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
        this.initializing = null;
    }

    async InitializeBrowser() {
        if (this.cluster) {
            return this.cluster;
        }

        if (!this.initializing) {
            this.initializing = this._initializeCluster();
        }

        return this.initializing;
    }

    async _initializeCluster() {
        try {
            this.cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_CONTEXT,
                maxConcurrency: 10,
                puppeteer,
                puppeteerOptions: {
                    headless: true,
                    // executablePath: chromiumPath,
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
                monitor: false,
                timeout: 1000,
                retryLimit: 2
            });

            this.cluster.on('taskerror', (err, data) => {
                console.error(`Error crawling ${data}: ${err.message}`);
            });

            this.cluster.task(async ({ page, data: { url, resolve, reject } }) => {
                try {
                    const start = Date.now();

                    await page.setExtraHTTPHeaders(default_headers);
                    await page.setJavaScriptEnabled(false);

                    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

                    const statusCode = response.status();
                    const pageContent = await page.content();

                    const end = Date.now();
                    const loadTime = end - start;

                    resolve({ link: url, statusCode, pageContent, loadTime });
                } catch (error) {
                    console.error('Error in cluster task:', error);
                    reject(error);
                }
            });

            console.log('Browser cluster initialized successfully.');
            return this.cluster;
        } catch (error) {
            console.error('Error initializing browser cluster:', error);
            this.cluster = null;
            throw error;
        } finally {
            this.initializing = null;
        }
    }

    async CloseBrowser() {
        try {
            if (this.cluster) {
                await this.cluster.idle();
                await this.cluster.close();
                this.cluster = null;
                console.log('Browser cluster closed.');
            }
        } catch (error) {
            console.error('Error closing browser cluster:', error);
        }
    }

    async GetPageContent(url, headers = default_headers) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.InitializeBrowser();

                if (this.cluster) {
                    this.cluster.queue({ url, resolve, reject });
                } else {
                    reject(new Error('Cluster is not initialized'));
                }
            } catch (error) {
                console.error('Error in GetPageContent:', error);
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