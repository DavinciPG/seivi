const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class EuronicsScraper extends BaseScraper {
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