const ScraperData = require('../database/models/scrapedData');

const _ = require('lodash');

async function getAllScrapedData() {
    try {
        const scrapedData = await ScraperData.findAll({
            attributes: ['ID', 'item_id', 'data', 'scraped_at'],
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function getScrapedDataForUser(user_id) {
    try {
        const scrapedData = await ScraperData.findAll({
            attributes: ['ID', 'item_id', 'data', 'scraped_at']
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function getScrapedDataForUserByItemId(user_id, item_id) {
    try {
        const scrapedData = await ScraperData.findAll({
            where: { item_id },
            attributes: ['ID', 'item_id', 'data', 'scraped_at']
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function createScrapedData(item_id, data) {
    try {
        // no reason to duplicate data
        const existingData = await ScraperData.findOne({
            where: {
                item_id
            },
            order: [['scraped_at', 'DESC']]
        });

        if(existingData && _.isEqual(existingData.data, JSON.parse(data)))
            return null;

        const scrapedData = await ScraperData.create({
            item_id,
            data: JSON.parse(data)
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

module.exports = { getAllScrapedData, createScrapedData, getScrapedDataForUser, getScrapedDataForUserByItemId };