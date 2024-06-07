const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class KlickScraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const response = await this.fetch_axios(Entry.link);

            // axios was blocked
            if (response.status === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            let $;
            if (response.status === 200) {
                $ = await this.cheerio_data(response.data);
            } else {
                const { statusCode, pageContent } = await BrowserController.GetPageContent(Entry.link);
                console.log(`Using BrowserController for entry: ${Entry.link}`);

                // @todo: maybe not all return a 200 // OK
                if(statusCode !== 200)
                    return;

                $ = await this.cheerio_data(pageContent);
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