const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');

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
        this.browser = null;

        this.InitializeBrowser = this.InitializeBrowser.bind(this);
        this.CloseBrowser = this.CloseBrowser.bind(this);
        this.GetPageContent = this.GetPageContent.bind(this);
    }

    async InitializeBrowser() {
        try {
            if (!this.browser) {
                this.browser = await puppeteer.launch({
                    //executablePath: chromiumPath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }
        } catch(error) {
            throw new Error(error.message);
        }
    }

    async CloseBrowser() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        } catch(error) {
            throw new Error(error.message);
        }
    }

    async GetPageContent(url, headers = default_headers) {
        try {
            if(!this.browser)
                await this.InitializeBrowser();

            const page = await this.browser.newPage();
            if (headers) {
                await page.setExtraHTTPHeaders(headers);
            }
            const response = await page.goto(url, { waitUntil: 'networkidle2' });

            const statusCode = response.status();
            const pageContent = await page.content();

            await page.close();

            return { statusCode, pageContent };
        } catch(error) {
            throw new Error(error.message);
        }
    }

    async GetData(content) {
        try {
            return cheerio.load(content);
        } catch(error) {
            throw new Error(error.message);
        }
    }
}

module.exports = new BrowserController();