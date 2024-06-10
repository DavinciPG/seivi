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
            console.time('Total Scraping Time');

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

            const itemsGroupedByScraper = Items.reduce((acc, item) => {
                const scraperName = Object.keys(ActiveScrapers).find(key => ActiveScrapers[key].id === item.scraper_id);
                if (!acc[scraperName]) {
                    acc[scraperName] = [];
                }
                acc[scraperName].push(item);
                return acc;
            }, {});

            await this.processScraperBatches(itemsGroupedByScraper);

            // @DavinciPG - @todo: why doesn't this function properly, gets called even though await
            console.timeEnd('Total Scraping Time');
            console.log(`Checked ${totalEntries} entries.`);
        } catch (error) {
            console.error(`Error in runAllScrapers: ${error.message}`);
        }
    }

    async processScraperBatches(itemsGroupedByScraper) {
        const promises = Object.keys(itemsGroupedByScraper).map(async (scraperName) => {
            const sublist = itemsGroupedByScraper[scraperName];
            const chunkSize = Math.ceil(sublist.length / 4);
            for (let i = 0; i < sublist.length; i += chunkSize) {
                const chunk = sublist.slice(i, i + chunkSize);
                const worker = new Worker(path.resolve(__dirname, '../scrapers/ScraperWorker.js'), {
                    workerData: {
                        entries: JSON.parse(JSON.stringify(chunk)),
                        options: { debug: false }
                    }
                });

                worker.on('message', async (messages) => {
                    await this.handleWorkerMessages(messages);
                });

                worker.on('error', (error) => {
                    console.error(`Worker error: `, error);
                });

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`Worker stopped with exit code ${code}`);
                    }
                });
            }
        });

        await Promise.all(promises);
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
                    await LoggingController.CreateLog(message.link, 'success', `Scraper completed ${message.entry.Scraper.name} for entry: ${JSON.stringify(message.entry)}`, { transaction });
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