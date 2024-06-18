const BaseScraper = require('./BaseScraper');

class EuronicsScraper extends BaseScraper {
    async scrape(Entry, browserController, Options) {
        return await this.performScrape(Entry, browserController, Options, $ => {
            const price = $('div.pricing-block__price .price__original').text().trim().replace('\u00A0', '');
            const dataPrice = price.split(' ')[0];
            return { price: dataPrice };
        });
    }
}

module.exports = new EuronicsScraper();