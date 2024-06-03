const axios = require('axios');
const cheerio = require('cheerio');

const scrapedData = require('../controllers/scrapedData');

async function scrape(entry, options) {
    try {
        const response = await axios.get(entry.link);
        const $ = cheerio.load(response.data);

        const price = $('div.pricing-block__price .price__original').text().trim().replace('\u00A0', '');
        const dataPrice = price.split(' ')[0];

        await scrapedData.createScrapedData(entry.link, JSON.stringify({
            price: dataPrice
        }));

        if (options.debug)
            console.log('Scraper finished.');
    } catch (error) {
        if (options.debug)
            console.error('Error:', error);
    }
}

module.exports = { scrape };