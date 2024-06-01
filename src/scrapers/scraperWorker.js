const { parentPort, workerData } = require('worker_threads');
const { runScraper } = require('../handlers/scraperHandler');

async function run() {
    try {
        const result = await runScraper(workerData.scraperName, workerData.entry, workerData.options);
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

run();