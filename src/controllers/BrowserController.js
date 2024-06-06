const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');

const chromiumPath = path.join(__dirname, '../../drivers/', 'chrome-linux', 'chrome');

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

    async GetPageContent(url, headers) {
        try {
            if(!this.browser)
                await this.InitializeBrowser();

            const page = await this.browser.newPage();
            if (headers) {
                await page.setExtraHTTPHeaders(headers);
            }
            await page.goto(url, { waitUntil: 'networkidle2' });
            const data = await page.content();
            await page.close();
            return data;
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