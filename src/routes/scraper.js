const express = require('express');
const router = express.Router();

const { checkNotAuthenticated, checkAuthenticated } = require('../handlers/authMiddleware');

const Item = require('../database/models/item');

const userScraperSettingsController = require('../controllers/userScraperSetting');
const itemController = require('../controllers/itemController');
const scrapedDataController = require('../controllers/scrapedData');

router.get(`/data`, checkAuthenticated, async (req, res) => {
    try
    {
        const scrapeSettings = await userScraperSettingsController.getAllScrapeSettings(req.session.user.id);

        const link_list = [];
        for(const setting of scrapeSettings) {
            const item = await itemController.findItemById(setting.dataValues.item_id);
            link_list.push(item.dataValues.link);
        }

        const scrapedData = await scrapedDataController.getAllScrapedDataForLinks(link_list);
        const filteredData = [];

        const getLinkById = async (id) => {
            const item = await Item.findByPk(id, { attributes: ['link'] });
            return item ? item.link : null;
        };

        for (const setting of scrapeSettings) {
            const link = await getLinkById(setting.dataValues.item_id);
            if (link) {
                const relevantData = scrapedData.filter(item => item.dataValues.link === link);
                for (const item of relevantData) {
                    const selectedParameters = setting.dataValues.selected_parameters;

                    const excludeKeys = Object.keys(selectedParameters).filter(key => !selectedParameters[key]);
                    const filteredDataObject = Object.keys(item.dataValues.data).reduce((result, key) => {
                        if (!excludeKeys.includes(key)) {
                            result[key] = item.dataValues.data[key];
                        }
                        return result;
                    }, {});

                    item.dataValues.data = filteredDataObject;
                    filteredData.push(item);
                }
            }
        }

        res.json(filteredData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @fixme: @DavinciPG - this is a temporary solution, pls fix thanks
router.post('/123', checkAuthenticated, async (req, res) => {
    try {
        const { link } = req.body;

         if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        const foundItem = await itemController.findItem(link);
        if(!foundItem) {
            return res.status(400).json({ message: 'Item not found in our database' });
        }

        const foundScrapeSetting = await userScraperSettingsController.getUserScraperSetting(req.session.user.id, foundItem.ID);
        if(!foundScrapeSetting) {
            return res.status(400).json({ message: 'You are not following this link' });
        }

        res.json(foundScrapeSetting.dataValues.selected_parameters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/', checkAuthenticated, async (req, res) => {
    try {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        const foundItem = await itemController.findItem(link);
        if(!foundItem) {
            return res.status(400).json({ message: 'Item not found in our database' });
        }

        const foundScrapeSetting = await userScraperSettingsController.getUserScraperSetting(req.session.user.id, foundItem.ID);
        if(!foundScrapeSetting) {
            return res.status(400).json({ message: 'You are not following this link' });
        }

        await userScraperSettingsController.deleteUserScraperSetting(req.session.user.id, foundItem.ID);

        // Here we check if we have more people following the link, if not then delete it from the scraper
        const otherFollowers = await userScraperSettingsController.getAllScrapeSettingsForItem(foundItem.ID);
        if(otherFollowers.length === 0) {
            await itemController.deleteItem(link);
        }

        return res.status(200).json({ message: 'Scraper entry deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/', checkAuthenticated, async (req, res) => {
    try {
        const { link, parameters } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        const foundItem = await itemController.findItem(link);
        if(!foundItem) {
            return res.status(400).json({ message: 'Item not found in our database' });
        }

        const foundScrapeSetting = await userScraperSettingsController.getUserScraperSetting(req.session.user.id, foundItem.ID);
        if(!foundScrapeSetting) {
            return res.status(400).json({ message: 'You are not following this link' });
        }

        // @todo: verify parameters

        await userScraperSettingsController.updateUserScraperSettingParameters(req.session.user.id, foundItem.ID, parameters);
       
        return res.status(200).json({ message: 'Entry parameters updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;