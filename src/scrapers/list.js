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

async function updateScraperEntry(entry) {
    try {
        const index = scraperList.findIndex(e => e.link === entry.link);
        if (index !== -1) {
            scraperList[index].last_checked = entry.last_checked;
            await saveScraperList();
        }
    } catch (error) {
        console.error('Error saving scraper list:', error);
    }
}

async function getScraperList() {
    const scrapersToRun = scraperList;
    // we can do magic here if needed, right now logically just return the list because we will do data return by date but data update every x time (dont know yet what x is)
    return scrapersToRun;
}

async function addScraperEntry(entry, user_id) {
    let existingEntry = scraperList.find(e => e.link === entry.link);
    if (existingEntry) {
        if(!existingEntry.users.includes(user_id))
            existingEntry.users.push(user_id);
        else
            // user already following this link
            return false;
    } else {
        const newEntry = {
            id: scraperList.length + 1,
            link: entry.link,
            last_checked: null,
            users: [user_id],
            scraper: entry.scraper
        };
        
        scraperList.push(newEntry);
    }
    await saveScraperList();
    return true;
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

module.exports = { getScraperList, addScraperEntry, removeScraperEntry, loadScraperList, updateScraperEntry, saveScraperList };