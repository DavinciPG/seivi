const BaseScraper = require('./BaseScraper');

class KlickScraper extends BaseScraper {
    async scrape(Entry, Options) {
        const { data, status } = await this.fetch(Entry.URL);
        
        // @DavinciPG - @todo: implement this, gotta do some testing, not sure what axios returns for a invalid page
        if (status === 404) {
            Entry.invalid = true;
            return {
                "invalid": true
            };
        }

        const $ = await this.data(data);

        const price = $('div.formatted-price.relative').text().trim().split('.');
        const dataPrice = `${price[0]}.${price[1]}`;
        const discount = $('div.discount-wrapper span.price-discount').text().trim();

        const json_data = JSON.stringify({
            price: dataPrice,
            discount: discount
        });

        // @DavinciPG - @todo: Implement saving to database

        return json_data;
    }
}

module.exports = new KlickScraper();