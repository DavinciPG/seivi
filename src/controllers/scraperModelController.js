const Scraper = require('../database/models/scraper');

async function findScraper(scraper_name) {
    try {
        const scraper = await Scraper.findOne({
            where: { name: scraper_name },
            attributes: ['ID', 'supported_parameters']
        });

        return scraper;
    } catch(error) {
        console.error(error);
    }
}

async function findScraperByID(scraper_id) {
    try {
        const scraper = await Scraper.findOne({
            where: { ID: scraper_id },
            attributes: ['ID', 'name', 'supported_parameters']
        });

        return scraper;
    } catch(error) {
        console.error(error);
    }
}

module.exports = { findScraper, findScraperByID };