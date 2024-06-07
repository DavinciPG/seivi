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
 * Runs the scraper and posts the result back to the parent thread.
 */
async function run() {
    if (!validateWorkerData(workerData)) {
        parentPort.postMessage({ success: false, error: 'Invalid worker data' });
        return;
    }

    const results = [];

    for(const entry of workerData.entries) {
        try {
            if (workerData.options.debug) {
                console.log(`Starting scraper: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`);
                await LoggingController.CreateLog(entry.link, 'info', `Starting scraper: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`);
            }

            const result = await ScraperController.RunScraper(entry.Scraper.name, entry, workerData.options);

            // shouldn't get here since we are not finding invalid entries?
            if (entry.invalid) {
                console.log(`Invalid entry: ${JSON.stringify(entry)}`);
                results.push({ invalid: true, link: entry.link, entry: entry });
                return;
            }

            if (!result.hasOwnProperty('error')) {
                const inserted_result = await ScrapeDataController.InsertScrapeData(entry.link, result);
                if (!inserted_result.success && inserted_result.type === 'INVALID') {
                    // @DavinciPG - setting this as invalid since it's missing item property somehow
                    results.push({ invalid: true, link: entry.link, entry: entry });
                    console.log(`Scraper hit invalid: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`);
                    return;
                }
            }

            results.push({ success: true, result, link: entry.link, entry: entry });

            if (workerData.options.debug) {
                console.log(`Scraper completed: ${entry.Scraper.name} for entry: ${JSON.stringify(entry)}`);
            }
        } catch (error) {
            if (workerData.options.debug) {
                logError(error);
            }

            results.push({ success: false, error: error.message, link: entry.link, entry: entry });
        }
    }

    parentPort.postMessage(results);
    process.exit();
}

run();