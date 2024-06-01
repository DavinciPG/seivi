let scraperList = [
    {
        link: 'https://www.klick.ee/sulearvuti-dell-latitude-5480-i5-8gb-512gb-w10pro-uue-ringi',
        last_checked: null,
        should_check_at: null,
        users: [],
        scraper: 'klick'
    },
    {
        link: 'https://www.klick.ee/nutikell-apple-watch-se-gps-40mm-alu?childSku=MNJT3EL%2FA',
        last_checked: null,
        should_check_at: null,
        users: [],
        scraper: 'klick'
    }
];

function getScraperList() {
    const now = new Date();
    return scraperList.filter(item => !item.should_check_at || item.should_check_at <= now);
}

function addScraperEntry(entry, user) {
    let existingEntry = scraperList.find(e => e.link === entry.link);
    if(existingEntry) {
        existingEntry.users.push(user.ID);
        return;
    }
    scraperList.push(entry);
}

function removeScraperEntry(id) {
    let index = scraperList.findIndex(e => e.link === id);
    if(index !== -1) {
        scraperList.splice(index, 1);
    }
}

module.exports = { getScraperList, addScraperEntry, removeScraperEntry };