const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class EuronicsScraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { statusCode, pageContent } = await BrowserController.GetPageContent(Entry.link);
            const $ = await BrowserController.GetData(pageContent);

            if(statusCode === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            const price = $('div.pricing-block__price .price__original').text().trim().replace('\u00A0', '');
            const dataPrice = price.split(' ')[0];

            return {
                price: dataPrice
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new EuronicsScraper();