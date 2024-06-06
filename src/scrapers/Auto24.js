const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { statusCode, pageContent } = await BrowserController.GetPageContent(Entry.link);
            const $ = await BrowserController.GetData(pageContent);

            if(statusCode === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            // @note: unused atm I do not know if we need it
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