const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const headers = {
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
            };

            const pageContent = await BrowserController.GetPageContent(Entry.link, headers);
            const $ = await BrowserController.GetData(pageContent);

            // @DavinciPG - @todo: fix status
            /*if(status == 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }*/

            // @note: unused atm idk if we need it
            const hind = $('tr.field-hind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();
            const soodus_hind = $('tr.field-soodushind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();

            return {
                price: soodus_hind
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new Auto24Scraper();