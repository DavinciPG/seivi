const Item = require('../database/models/item');

const scraperModelController = require('./scraperModelController');

async function getAllItems(needs_name = false) {
    try {
        const items = await Item.findAll({
            attributes: ['ID', 'link', 'scraper_id']
        });
        
        if(needs_name) {
            for (const item of items) {
                const scraper = await scraperModelController.findScraperByID(item.dataValues.scraper_id);
                item.dataValues.scraper = scraper.dataValues.name;
            }
        }

        return items;
    } catch(error) {
        console.error(error);
    }
}

async function findItem(link) {
    try {
        const item = await Item.findOne({
            where: { link }
        });

        return item;
    } catch(error) {
        console.error(error);
    }
}

async function createItem(link, scraper_name) {
    try {
        const scraper = await scraperModelController.findScraper(scraper_name);
        if(!scraper)
            return null;

        const item = await Item.create({
            link,
            scraper_id: scraper.ID
        });

        return item;
    } catch(error) {
        console.error(error);
    }
}

async function deleteItem(link) {
    try {
        await Item.destroy({
            where: { link }
        });
    } catch(error) {
        console.error(error);
    }
}

module.exports = { getAllItems, createItem, deleteItem, findItem };