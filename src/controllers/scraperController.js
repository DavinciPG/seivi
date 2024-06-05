const { Worker } = require('worker_threads');
const path = require('path');

const KlickScraper = require('../scrapers/Klick');
const EuronicsScraper = require('../scrapers/Euronics');

const { models } = require('../database');

const ActiveScrapers = {
    'klick': KlickScraper,
    'euronics': EuronicsScraper
};

class ScraperController {
    constructor() {
        this.runScraperWorker = this.runScraperWorker.bind(this);
        this.runAllScrapers = this.runAllScrapers.bind(this);
    }

    async RunScraper(ScraperName, Entry, Options = { debug: false }) {
        try {
            const scraper = ActiveScrapers[ScraperName];
            if (!scraper) {
                return { error: `Scraper '${ScraperName}' not found` };
            }

            return await scraper.scrape(Entry, Options);
        } catch (error) {
            return { error: error.message };
        }
    }

    async runAllScrapers() {
        try {
            const Items = await models.Item.findAll({
                attributes: ['link', 'scraper_id', 'invalid'],
                include: [{
                    model: models.Scraper,
                    attributes: ['name'],
                }],
            });

            for (const scraperEntry of Items) {
                if (scraperEntry.dataValues.invalid) {
                    // @DavinciPG - @todo: Implement invalid item handling, usually means page returns a 404
                    continue;
                }

                this.runScraperWorker(scraperEntry);
            }
        } catch (error) {
            console.error('Error getting scraper list:', error);
        }
    }

    runScraperWorker(scraperEntry) {
        const json_data = scraperEntry.toJSON();
        const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
            workerData: {
                scraperName: scraperEntry.Scraper.name,
                entry: json_data,
                options: { debug: false } // set debug to true when you want the scraper to log information for each link
            }
        });

        worker.on('message', async (message) => {
            if(message.invalid)
            {
                // @DavinciPG - @todo: doesn't work atm since message.invalid isn't a thing
                models.Item.update({ invalid: true }, { where: { link: scraperEntry.link } });
            } else if (message.success) {
                // you can debug the result here if needed
                //console.log(`Scraper ${scraperEntry.Scraper.name} completed successfully for ${scraperEntry.link}`);
            } else {
                console.error(`Error running scraper for ${scraperEntry.link}:`, message.error);
            }
        });

        worker.on('error', (error) => {
            console.error(`Worker error for ${scraperEntry.Scraper.name}:`, error);
            if(error.message == 'Page not found') {
               models.Item.update({ invalid: true }, { where: { link: scraperEntry.link } });
            }
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker for ${scraperEntry.Scraper.name} stopped with exit code ${code}`);
            }
        });
    }
}

module.exports = new ScraperController();