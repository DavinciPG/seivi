const axios = require('axios');
const cheerio = require('cheerio');

const scrapedData = require('../../controllers/scrapedData');

async function scrape(entry, options) {
    try {
        const response = await axios.get(entry.link);
        const $ = cheerio.load(response.data);

        const price = $('div.formatted-price.relative').text().trim().split('.');
        const dataPrice = `${price[0]}.${price[1]}`;

        const discount = $('div.discount-wrapper span.price-discount').text().trim();

        await scrapedData.createScrapedData(entry.ID, JSON.stringify({
            price: dataPrice,
            discount: discount
        }));

        if (options.debug)
            console.log('Scraper finished.');
    } catch (error) {
        if (options.debug)
            console.error('Error:', error);
    }
}

module.exports = { scrape };