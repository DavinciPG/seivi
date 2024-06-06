const { Worker } = require('worker_threads');
const path = require('path');

const KlickScraper = require('../scrapers/Klick');
const EuronicsScraper = require('../scrapers/Euronics');

const LoggingController = require('./LoggingController');

const { models } = require('../database');

const ActiveScrapers = {
    'klick': { 
        id: 1, 
        scraper: KlickScraper,
        regex: /^(https:\/\/)?www\.klick\.ee\/.*$/
    },
    'euronics': { 
        id: 2, 
        scraper: EuronicsScraper,
        regex: /^(https:\/\/)?www\.euronics\.ee\/.*$/
    }
};

class ScraperController {
    constructor() {
        this.runScraperWorker = this.runScraperWorker.bind(this);
        this.runAllScrapers = this.runAllScrapers.bind(this);
        this.GetScrapers = this.GetScrapers.bind(this);
    }

    async GetScrapers() {
        return Object.keys(ActiveScrapers);
    }
    async RunScraper(ScraperName, Entry, Options = { debug: false }) {
        try {
            const scraper = ActiveScrapers[ScraperName];
            if (!scraper) {
                return { error: `Scraper '${ScraperName}' not found` };
            }
            
            const result = await scraper.scraper.scrape(Entry, Options);
            return result;
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

            for (let scraperEntry of Items) {
                if (scraperEntry.dataValues.invalid) {
                    // @DavinciPG - @note: Skip invalid entries but should we notify the dev?
                    continue;
                }

                this.runScraperWorker(scraperEntry, false);
            }
        } catch (error) {
            console.error('Error getting scraper list:', error);
        }
    }

    runScraperWorker(scraperEntry, debug = false) {
        const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
            workerData: {
                scraperName: scraperEntry.Scraper.name,
                entry: JSON.parse(JSON.stringify(scraperEntry)),
                options: { debug } // set debug to true when you want the scraper to log information for each link
            }
        });

        worker.on('message', async (message) => {
            if(message.invalid)
            {
                if(debug)
                    console.log(`Scraper ${scraperEntry.Scraper.name} invalid entry for ${scraperEntry.link}`);

                models.Item.update({ invalid: true }, { where: { link: scraperEntry.link } });
                LoggingController.CreateLog(scraperEntry.link, 'invalid', 'Invalid entry');
            } else if (message.success) {
                // you can debug the result here if needed
                if(debug) {
                    console.log(`Scraper ${scraperEntry.Scraper.name} completed successfully for ${scraperEntry.link}`);
                    models.Logging.create({
                        link: scraperEntry.link,
                        type: 'success',
                        message: 'Scraper completed'
                    });
                }
            } else {
                console.error(`Error running scraper for ${scraperEntry.link}:`, message.error);
                if(debug) {
                    LoggingController.CreateLog(scraperEntry.link, 'error', message.error);
                }
            }
        });

        worker.on('error', (error) => {
            console.error(`Worker error for ${scraperEntry.Scraper.name}:`, error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker for ${scraperEntry.Scraper.name} stopped with exit code ${code}`);
            }
        });
    }
}

module.exports = new ScraperController();