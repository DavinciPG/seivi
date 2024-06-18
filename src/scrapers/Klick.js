const BaseScraper = require('./BaseScraper');

class KlickScraper extends BaseScraper {
    async scrape(Entry, browserController, Options) {
        return await this.performScrape(Entry, browserController, Options, $ => {
            const priceText = $('div.formatted-price.relative').text().trim();
            const cleanedPrice = priceText.split('\n')[0].trim();
            const formattedPrice = `${cleanedPrice}€`;
            const discount = $('div.discount-wrapper span.price-discount').text().trim();
            const formattedDiscount = `${discount.length > 0 ? discount : '0'}€`;
            return {
                price: formattedPrice,
                discount: formattedDiscount
            };
        });
    }
}

module.exports = new KlickScraper();