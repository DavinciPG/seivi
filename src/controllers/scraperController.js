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

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    groupItems(items, numGroups) {
        const groupedItems = Array.from({ length: numGroups }, () => []);
        items.forEach((item, index) => {
            groupedItems[index % numGroups].push(item);
        });
        return groupedItems;
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

            const totalEntries = Items.length;
            console.log(`Total entries to process: ${totalEntries}`);

            const shuffledItems = this.shuffleArray(Items);
            const itemsGrouped = this.groupItems(shuffledItems, 4);

            await this.processScraperBatches(itemsGrouped);

            // @DavinciPG - @todo: why doesn't this function properly, gets called even though await
            console.timeEnd('Total Scraping Time');
            await BrowserController.CloseBrowser();
        } catch (error) {
            console.error(`Error in runAllScrapers: ${error.message}`);
        }
    }

    async processScraperBatches(itemsGrouped) {
        console.time('Total Scraping Time');

        const workerPromises = [];

        itemsGrouped.forEach((chunk) => {
            const workerPromise = new Promise((resolve, reject) => {
                const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
                    workerData: {
                        entries: JSON.parse(JSON.stringify(chunk)),
                        options: { debug: true }
                    }
                });

                worker.on('message', async (messages) => {
                    await this.handleWorkerMessages(messages);
                });

                worker.on('error', (error) => {
                    console.error(`Worker error: `, error);
                    reject(error);
                });

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`Worker stopped with exit code ${code}`);
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    } else {
                        resolve();
                    }
                });
            });

            workerPromises.push(workerPromise);
        });

        await Promise.all(workerPromises);
    }

    async handleWorkerMessages(messages) {
        for (const message of messages) {
            const transaction = await models.sequelize.transaction();
            try {
                if (message.invalid) {
                    console.log(`Scraper ${message.entry.Scraper.name} invalid entry for ${message.link}`);

                    await models.Item.update({invalid: true}, {
                        where: {
                            link: message.link
                        },
                        transaction
                    });

                    await LoggingController.CreateLog(message.link, 'invalid', 'Invalid entry', { transaction });
                } else if (message.success) {
                    const insertedResult = await ScrapeDataController.InsertScrapeData(message.link, message.result, { transaction });
                    if (!insertedResult.success && insertedResult.type === 'INVALID') {
                        console.log(`Scraper hit invalid: ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`);
                        await LoggingController.CreateLog(message.link, 'invalid', `Scraper completed ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`, { transaction });
                    } else {
                        await LoggingController.CreateLog(message.link, 'success', `Scraper completed ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`, { transaction });
                    }
                } else {
                    console.error(`Error running scraper for ${message.link}:`, message.error);
                    await LoggingController.CreateLog(message.link, 'error', message.error, { transaction });
                }

                await transaction.commit();
            } catch(error) {
                await transaction.rollback();
            }
        }
    }
}

module.exports = new ScraperController();