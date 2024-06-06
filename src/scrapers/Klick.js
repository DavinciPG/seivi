const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class KlickScraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { statusCode, pageContent } = await BrowserController.GetPageContent(Entry.link);
            const $ = await BrowserController.GetData(pageContent);

            if(statusCode === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            const priceText = $('div.formatted-price.relative').text().trim();
            const cleanedPrice = priceText.split('\n')[0].trim(); 
            const formattedPrice = `${cleanedPrice}€`;
            const discount = $('div.discount-wrapper span.price-discount').text().trim();
            const formattedDiscount = `${discount.length > 0 ? discount : '0'}€`;

            return {
                price: formattedPrice,
                discount: formattedDiscount
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new KlickScraper();