const fs = require('fs');
const path = require('path');

const scraperListFilePath = path.join(__dirname, 'scraperList.json');
let scraperList = [];

async function loadScraperList() {
    try {
        if (fs.existsSync(scraperListFilePath)) {
            const data = await fs.promises.readFile(scraperListFilePath, 'utf8');
            scraperList = JSON.parse(data);
        }
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
    const now = new Date();
    const scrapersToRun =  scraperList.filter(item => !item.should_check_at || item.should_check_at <= now);
    return scrapersToRun;
}

async function addScraperEntry(entry, user) {
    let existingEntry = scraperList.find(e => e.link === entry.link);
    if (existingEntry) {
        existingEntry.users.push(user.ID);
    } else {
        scraperList.push(entry);
    }
    await saveScraperList();
}

async function removeScraperEntry(link, user_id) {
    let entry = scraperList.find(e => e.link === link);
    if (entry) {
        const userIndex = entry.users.indexOf(user_id);
        if (userIndex !== -1) {
            entry.users.splice(userIndex, 1);
        }
        if (entry.users.length === 0) {
            const entryIndex = scraperList.indexOf(entry);
            if (entryIndex !== -1) {
                scraperList.splice(entryIndex, 1);
            }
        }
    }
    await saveScraperList();
}

module.exports = { getScraperList, addScraperEntry, removeScraperEntry, loadScraperList };