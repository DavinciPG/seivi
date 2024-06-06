const BaseScraper = require('./BaseScraper');

class EuronicsScraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { data, status } = await this.fetch(Entry.link);

            if(status == 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            const $ = await this.data(data);

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