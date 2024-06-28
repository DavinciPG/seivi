const { Worker } = require('worker_threads');
const path = require('path');

const KlickScraper = require('../scrapers/Klick');
const EuronicsScraper = require('../scrapers/Euronics');
const Auto24Scraper = require('../scrapers/Auto24');

const LoggingController = require('./LoggingController');
const BrowserController = require('./BrowserController');

const { models } = require('../database');
const ScrapeDataController = require("./ScrapeDataController");

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
        this.runAllScrapers = this.runAllScrapers.bind(this);
        this.GetScrapers = this.GetScrapers.bind(this);
    }

    async GetScrapers() {
        return ActiveScrapers;
    }

    async RunScraper(ScraperName, Entry, browserController, Options) {
        try {
            const scraper = ActiveScrapers[ScraperName];
            if (!scraper) {
                return { error: `Scraper '${ScraperName}' not found` };
            }

            const result = await scraper.scraper.scrape(Entry, browserController, Options);
            return result;
        } catch (error) {
            console.error(`Error in RunScraper: ${error.message}`);
            return { error: error.message };
        }
    }

    shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    groupItems(items, numGroups) {
        return items.reduce((groups, item, i) => {
            groups[i % numGroups].push(item);
            return groups;
        }, Array.from({ length: numGroups }, () => []));
    }

    async runAllScrapers() {
        const entries = await models.Item.findAll({
            where: {
                invalid: false
            },
            attributes: ['link', 'scraper_id', 'invalid'],
            include: [{
                model: models.Scraper,
                attributes: ['name'],
            }]
        });

        const totalEntries = entries.length;
        console.log(`Total entries to process: ${totalEntries}`);
        console.time('Total Scraping Time');

        const shuffledEntries = this.shuffleArray(entries);
        const chunkSize = Math.ceil(shuffledEntries.length / Object.keys(ActiveScrapers).length);
        const entryChunks = [];

        for (let i = 0; i < shuffledEntries.length; i += chunkSize) {
            entryChunks.push(shuffledEntries.slice(i, i + chunkSize));
        }

        const workerPromises = entryChunks.map((chunk, index) => {
            const scraperNames = Object.keys(ActiveScrapers);
            const scraperName = scraperNames[index % scraperNames.length];

            return this.runWorker(scraperName, chunk);
        });

        await Promise.all(workerPromises);

        console.timeEnd('Total Scraping Time');
    }

    runWorker(entriesForScraper) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
                workerData: { entries: entriesForScraper }
            });

            worker.on('message', async (message) => {
                await this.handleWorkerMessages(message);
            });

            worker.on('error', reject);

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                } else {
                    resolve();
                }
            });
        });
    }

    async handleWorkerMessages(messages) {
        for (const message of messages) {
            const transaction = await models.sequelize.transaction();
            try {
                if (message.invalid) {
                    await this.logInvalidEntry(message, transaction);
                } else if (message.success) {
                    await this.logSuccessEntry(message, transaction);
                } else {
                    await this.logErrorEntry(message, transaction);
                }
                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                console.error(`Transaction error: ${error.message}`);
            }
        }
    }

    async logInvalidEntry(message, transaction) {
        console.log(`Scraper ${message.entry.Scraper.name} invalid entry for ${message.link}`);
        await models.Item.update({ invalid: true }, { where: { link: message.link }, transaction });
        await LoggingController.CreateLog(message.link, 'invalid', 'Invalid entry', { transaction });
    }

    async logSuccessEntry(message, transaction) {
        await LoggingController.CreateLog(message.link, 'success', `Scraper completed ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`, { transaction });
    }

    async logErrorEntry(message, transaction) {
        console.error(`Error running scraper for ${message.link}: ${message.error}`);
        await LoggingController.CreateLog(message.link, 'error', message.error, { transaction });
    }
}

module.exports = new ScraperController();