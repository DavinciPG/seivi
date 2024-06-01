const { parentPort, workerData } = require('worker_threads');
const { runScraper } = require('../handlers/scraperHandler');

async function run() {
    try {
        // for now scrapers don't return a result but you can modify them to return something if needed
        const result = await runScraper(workerData.scraperName, workerData.entry, workerData.options);
        parentPort.postMessage({ success: true, result, data: { entry: workerData.entry } });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

run();