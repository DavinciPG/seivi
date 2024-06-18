const { parentPort, workerData } = require('worker_threads');

const ScraperController = require('../controllers/ScraperController');
const ScrapeDataController = require('../controllers/ScrapeDataController');
const LoggingController = require('../controllers/LoggingController');
const BrowserController = require('../controllers/BrowserController');

const { models } = require('../database');

/**
 * Validates the worker data to ensure all required fields are present.
 * @param {Object} data - The worker data.
 * @returns {boolean} - True if valid, false otherwise.
 */
function validateWorkerData(data) {
    return data && data.entries && data.options;
}

/**
 * Logs error details for debugging.
 * @param {Error} error - The error object.
 */
function logError(error) {
    console.error(`Scraper Error: ${error.message}`, {
        stack: error.stack
    });
}

/**
 * Processes a single entry by running the scraper and logging the result.
 * @param {Object} entry - The entry to process.
 * @param {Object} options - The options for processing.
 * @param {Class} browserController - browserContoller class
 * @returns {Object} - The result of processing the entry.
 */
async function processEntry(entry, options, browserController, transaction) {
    try {
        if (options.debug) {
            await LoggingController.CreateLog(entry.link, 'info', `Starting scraper: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`, { transaction });
        }

        const result = await ScraperController.RunScraper(entry.Scraper.name, entry, browserController, options);

        if (entry.invalid) {
            console.log(`Invalid entry: ${JSON.stringify(entry)}`);
            return { invalid: true, link: entry.link, entry: entry };
        }

        if(!result.hasOwnProperty('error')) {
            const inserted_result = await ScrapeDataController.InsertScrapeData(entry.link, result);
            if(!inserted_result.success && inserted_result.type === 'INVALID') {
                parentPort.postMessage({ invalid: true, data: { entry: entry } });
                console.log(`Scraper hit invalid: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`);
                return;
            }
        }

        return { success: true, result, link: entry.link, entry: entry };
    } catch (error) {
        logError(error);
        return { success: false, error: error.message, link: entry.link, entry: entry };
    }
}

/**
 * Runs the scraper and posts the result back to the parent thread.
 */
async function run() {
    if (!validateWorkerData(workerData)) {
        parentPort.postMessage({ success: false, error: 'Invalid worker data' });
        return;
    }

    const results = [];
    const transaction = await models.sequelize.transaction();

    const browserController = new BrowserController();
    await browserController.initializeCluster();

    try {
        for (const entry of workerData.entries) {
            const result = await processEntry(entry, workerData.options, browserController, transaction);
            results.push(result);
        }

        await transaction.commit();
    } catch(error) {
        await transaction.rollback();
    }

    await browserController.closeCluster();

    parentPort.postMessage(results);
    process.exit();
}

run();