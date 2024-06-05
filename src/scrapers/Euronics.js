const BaseScraper = require('./BaseScraper');

class EuronicsScraper extends BaseScraper {
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

        const price = $('div.pricing-block__price .price__original').text().trim().replace('\u00A0', '');
        const dataPrice = price.split(' ')[0];

        const json_data = JSON.stringify({
            price: dataPrice
        });

        // @DavinciPG - @todo: Implement saving to database

        return json_data;
    }
}

module.exports = new EuronicsScraper();