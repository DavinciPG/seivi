const { runScraper } = require('../handlers/scraperHandler');
const { getScraperList } = require('../scrapers/list');

async function runAllScrapers() {
    const scrapersToRun = await getScraperList();
    for (const scraperEntry of scrapersToRun) {
        try {
            await runScraper(scraperEntry.scraper, scraperEntry, { debug: false });
        } catch (error) {
            console.error(`Error running scraper for ${scraperEntry.link}:`, error);
        }
    }
}

module.exports = { runAllScrapers };