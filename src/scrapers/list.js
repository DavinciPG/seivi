const fs = require('fs');
const path = require('path');

const itemController = require('../controllers/itemController');

const scraperListFilePath = path.join(__dirname, 'scraperList.json');
let scraperList = [];

async function loadScraperList() {
    try {
        const items = await itemController.getAllItems(true);

        const itemData = JSON.stringify(items);
        scraperList = JSON.parse(itemData);

        // save the data to the file
        await saveScraperList();
    } catch (error) {
        console.error('Error loading scraper list:', error);
    }
}

async function saveScraperList() {
    try {
        const data = JSON.stringify(scraperList, null, 2);
        await fs.promises.writeFile(scraperListFilePath, data, 'utf8');
    } catch (error) {
        console.error('Error saving scraper list:', error);
    }
}

async function getScraperList() {
    const scrapersToRun = scraperList;
    // we can do magic here if needed, right now logically just return the list because we will do data return by date but data update every x time (dont know yet what x is)
    return scrapersToRun;
}

module.exports = { getScraperList, loadScraperList, saveScraperList };