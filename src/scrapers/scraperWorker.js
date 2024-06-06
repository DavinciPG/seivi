const { parentPort, workerData } = require('worker_threads');

const ScraperController = require('../controllers/ScraperController');
const ScrapeDataController = require('../controllers/ScrapeDataController');
const LoggingController = require('../controllers/LoggingController');

/**
 * Validates the worker data to ensure all required fields are present.
 * @param {Object} data - The worker data.
 * @returns {boolean} - True if valid, false otherwise.
 */
function validateWorkerData(data) {
    return data && data.scraperName && data.entry && data.options;
}

/**
 * Logs error details for debugging.
 * @param {Error} error - The error object.
 */
function logError(error) {
    console.error(`Scraper Error: ${error.message}`, {
        stack: error.stack,
        scraperName: workerData.scraperName,
        entry: workerData.entry,
    });
}

/**
 * Runs the scraper and posts the result back to the parent thread.
 */
async function run() {
    if (!validateWorkerData(workerData)) {
        parentPort.postMessage({ success: false, error: 'Invalid worker data' });
        return;
    }

    try {
        if(workerData.options.debug) {
            console.log(`Starting scraper: ${workerData.scraperName} for entry: ${JSON.stringify(workerData.entry)}`);
            await LoggingController.CreateLog(workerData.entry.link, 'info', `Starting scraper: ${workerData.scraperName} for entry: ${JSON.stringify(workerData.entry)}`);
        }

        const result = await ScraperController.RunScraper(workerData.scraperName, workerData.entry, workerData.options);

        if(workerData.entry.invalid) {
            console.log(`Invalid entry: ${JSON.stringify(workerData.entry)}`);
            parentPort.postMessage({ invalid: true, data: { entry: workerData.entry } });
            return;
        }

        // @DavinciPG - @todo: InsertScrapeData returns a boolean so we can check if the data was inserted
        if(!result.hasOwnProperty('error'))
            await ScrapeDataController.InsertScrapeData(workerData.entry.link, JSON.stringify(result));

        parentPort.postMessage({ success: true, result, data: { entry: workerData.entry } });

        if(workerData.options.debug) {
            console.log(`Scraper completed: ${workerData.scraperName} for entry: ${JSON.stringify(workerData.entry)}`);
        }
    } catch (error) {
        if(workerData.options.debug) {
            logError(error);
        }

        parentPort.postMessage({ success: false, error: error.message });
    } finally {
        process.exit();
    }
}

run();