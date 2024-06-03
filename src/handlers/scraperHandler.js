const klickScraper = require('../scrapers/klick/klick_ee');
const euronicsScraper = require('../scrapers/euronics_ee');

const scrapers = {
    'klick': klickScraper,
    'euronics': euronicsScraper,
};

function runScraper(scraperName, entry, options) {
    const scraper = scrapers[scraperName];
    if (scraper) {
        return scraper.scrape(entry, options);
    } else {
        throw new Error(`Scraper ${scraperName} not found`);
    }
}

module.exports = { runScraper };