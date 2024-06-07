const { Worker } = require('worker_threads');
const path = require('path');

const KlickScraper = require('../scrapers/Klick');
const EuronicsScraper = require('../scrapers/Euronics');
const Auto24Scraper = require('../scrapers/Auto24');

const LoggingController = require('./LoggingController');
const BrowserController = require('./BrowserController');

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
    },
    'auto24': {
        id: 3,
        scraper: Auto24Scraper,
        regex: /^(https:\/\/)?www\.auto24\.ee\/.*$/
    }
};

class ScraperController {
    constructor() {
        this.runScraperWorker = this.runScraperWorker.bind(this);
        this.runAllScrapers = this.runAllScrapers.bind(this);
        this.GetScrapers = this.GetScrapers.bind(this);
    }

    async GetScrapers() {
        return ActiveScrapers;
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
            await BrowserController.InitializeBrowser();

            const Items = await models.Item.findAll({
                where: {
                    invalid: false
                },
                attributes: ['link', 'scraper_id', 'invalid'],
                include: [{
                    model: models.Scraper,
                    attributes: ['name'],
                }]
            });

            console.log('Starting scraper');
            const timeStart = new Date().getTime();

            /*const results = await Promise.all(Items.map(item => BrowserController.GetPageContent(item.dataValues.link)));
            results.forEach((result, index) => {
                const { link, status, html, loadTime } = result;

                console.log(`${link} took ${loadTime}`);
            });*/

            // Split the array into x lists
            function splitIntoSublists(array, numSublists) {
                const sublists = Array.from({ length: numSublists }, () => []);
                array.forEach((item, index) => {
                    sublists[index % numSublists].push(item);
                });
                return sublists;
            }

            const sublists = splitIntoSublists(Items, 6);
            const workerPromises = sublists.map((list) => this.runScraperWorker(list, true));

            try {
                await Promise.all(workerPromises);
                console.log(`Scraper finished with ${Items.length} entries`);
                console.log(`Total time: ${new Date().getTime() - timeStart}ms`);
            } catch(error) {
                console.error('Error in worker execution:', error);
            } finally {
                await BrowserController.CloseBrowser();
            }
        } catch (error) {
            console.error('Error scraping data:', error);
        }
    }

    runScraperWorker(sublist, debug = false) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
                workerData: {
                    entries: JSON.parse(JSON.stringify(sublist)),
                    options: {debug} // set debug to true when you want the scraper to log information for each link
                }
            });

            worker.on('message', async (messages) => {
                for (const message of messages) {
                    if (message.invalid) {
                        if (debug)
                            console.log(`Scraper ${message.entry.Scraper.name} invalid entry for ${message.link}`);

                        await models.Item.update({invalid: true}, {where: {link: message.link}});
                        await LoggingController.CreateLog(message.link, 'invalid', 'Invalid entry');
                    } else if (message.success) {
                        // you can debug the result here if needed
                        if (debug) {
                            await LoggingController.CreateLog(message.link, 'success', `Scraper completed ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`);
                        }
                    } else {
                        console.error(`Error running scraper for ${message.link}:`, message.error);
                        if (debug) {
                            await LoggingController.CreateLog(message.link, 'error', message.error);
                        }
                    }
                }
            });

            worker.on('error', (error) => {
                console.error(`Worker error: `, error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
            });
        });
    }
}

module.exports = new ScraperController();