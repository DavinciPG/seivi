const { Worker } = require('worker_threads');
const path = require('path');
const { getScraperList, updateScraperEntry } = require('../scrapers/list');

function runAllScrapers() {
    getScraperList().then(scrapersToRun => {
        for (const scraperEntry of scrapersToRun) {
            const worker = new Worker(path.resolve(__dirname, '../scrapers/scraperWorker.js'), {
                workerData: {
                    scraperName: scraperEntry.scraper,
                    entry: scraperEntry,
                    options: { debug: false } // set debug to true when you want the scraper to log information for each link
                }
            });

            worker.on('message', async (message) => {
                if (message.success) {
                    // you can debug the result here if needed
                    await updateScraperEntry(message.data.entry);
                } else {
                    console.error(`Error running scraper for ${scraperEntry.link}:`, message.error);
                }
            });

            worker.on('error', (error) => {
                console.error(`Worker error: ${error}`);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
            });
        }
    }).catch(error => {
        console.error('Error getting scraper list:', error);
    });
}

module.exports = { runAllScrapers };