const BaseScraper = require('./BaseScraper');

class KlickScraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { data, status } = await this.fetch(Entry.link);
    
            if(status == 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            const $ = await this.data(data);

            const price = $('div.formatted-price.relative').text().trim().split('.');
            const dataPrice = `${price[0]}.${price[1]}`;
            const discount = $('div.discount-wrapper span.price-discount').text().trim();

            return {
                price: dataPrice,
                discount: discount
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new KlickScraper();