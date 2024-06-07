const BaseScraper = require('./BaseScraper');

const BrowserController = require('../controllers/BrowserController');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const response = await this.fetch_axios(Entry.link);

            if (response.status === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            let $;
            if (response.status === 200) {
                $ = await this.cheerio_data(response.data);
            } else {
                // axios was blocked
                const { statusCode, pageContent } = await BrowserController.GetPageContent(Entry.link);
                console.log(`Using BrowserController for entry: ${Entry.link}`);

                // @todo: maybe not all return a 200 // OK
                if(statusCode !== 200)
                    return { error: 'Failed Loading Page'};

                $ = await this.cheerio_data(pageContent);
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