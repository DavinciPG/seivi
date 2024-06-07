const BaseScraper = require('./BaseScraper');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        return await this.performScrape(Entry, $ => {
            const hind = $('tr.field-hind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();
            const soodus_hind = $('tr.field-soodushind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();
            return { price: soodus_hind };
        });
    }
}

module.exports = new Auto24Scraper();