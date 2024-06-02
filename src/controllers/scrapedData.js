const ScraperData = require('../database/models/scrapedData');
const Item = require('../database/models/item');

const _ = require('lodash');

async function getAllScrapedData() {
    try {
        const scrapedData = await ScraperData.findAll({
            attributes: ['ID', 'link', 'data', 'scraped_at'],
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function getScrapedDataForUser(user_id) {
    try {
        const scrapedData = await ScraperData.findAll({
            where: { user_id },
            attributes: ['ID', 'link', 'data', 'scraped_at']
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function getScrapedDataForUserByLink(user_id, link) {
    try {
        const scrapedData = await ScraperData.findAll({
            where: { link, user_id },
            attributes: ['ID', 'link', 'data', 'scraped_at']
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function createScrapedData(link, data) {
    try {
        // no reason to duplicate data
        const existingData = await ScraperData.findOne({
            where: {
                link
            },
            order: [['scraped_at', 'DESC']]
        });

        if(existingData && _.isEqual(existingData.data, JSON.parse(data)))
            return null;

        // fix to remove errors when the item gets deleted mid-scrape
        const itemExists = await Item.findOne({
            where: { link: link }
        });

        if(!itemExists)
            return null;

        const scrapedData = await ScraperData.create({
            link,
            data: JSON.parse(data)
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

module.exports = { getAllScrapedData, createScrapedData, getScrapedDataForUser, getScrapedDataForUserByLink };