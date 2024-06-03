const ScraperData = require('../database/models/scrapedData');
const Item = require('../database/models/item');

const _ = require('lodash');

const { Op } = require('sequelize');

async function getAllScrapedData() {
    try {
        const scrapedData = await ScraperData.findAll({
            attributes: ['ID', 'link', 'data', 'scraped_at'],
            order: [['link'], ['scraped_at', 'DESC']]
        });

        return scrapedData;
    } catch(error) {
        console.error(error);
    }
}

async function getAllScrapedDataForLinks(link_list) {
    try {
        const scrapedData = await ScraperData.findAll({
            where: {
                link: {
                    [Op.in]: link_list
                }
            },
            attributes: ['ID', 'link', 'data', 'scraped_at'],
            order: [['link'], ['scraped_at', 'DESC']]
        });

        const groupedData = scrapedData.reduce((acc, item) => {
            if (!acc[item.dataValues.link]) {
                acc[item.dataValues.link] = [];
            }
            if (acc[item.dataValues.link].length < 2) {
                acc[item.dataValues.link].push(item);
            }
            return acc;
        }, {});

        return Object.values(groupedData).flat();;
    } catch(error) {
        console.error(error);
    }
}

async function getScrapedDataByLink(link) {
    try {
        const scrapedData = await ScraperData.findAll({
            where: { link },
            attributes: ['ID', 'link', 'data', 'scraped_at'],
            order: [['link'], ['scraped_at', 'DESC']]
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

module.exports = { getAllScrapedData, createScrapedData, getScrapedDataByLink, getAllScrapedDataForLinks };