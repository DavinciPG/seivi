const axios = require('axios');
const cheerio = require('cheerio');
const { saveToCsv } = require('../../controllers/csvController');

async function scrape(entry, options) {
    try {
        const response = await axios.get(entry.link);
        const $ = cheerio.load(response.data);

        const price = $('div.formatted-price.relative').text().trim();
        const priceParts = price.split('.');
        const dollars = priceParts[0];
        const cents = priceParts[1];
        entry.price = `${dollars}.${cents}`;

        const discount = $('div.discount-wrapper span.price-discount').text().trim();
        entry.discount = discount;

        entry.last_checked = new Date();

        const records = [{
            id: entry.id,
            link: entry.link,
            last_checked: entry.last_checked.toISOString(),
            price: entry.price,
            discount: entry.discount
        }];

        const fields = ['id', 'link', 'last_checked', 'price', 'discount'];
        await saveToCsv(records, fields, options);

        if (options.debug)
            console.log('Scraper finished.');
    } catch (error) {
        if (options.debug)
            console.error('Error:', error);
    }
}

module.exports = { scrape };