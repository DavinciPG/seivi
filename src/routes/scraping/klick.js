const express = require('express');
const router = express.Router();

const { checkNotAuthenticated, checkAuthenticated } = require('../../handlers/authMiddleware');

const itemController = require('../../controllers/itemController');
const userScraperSettingsController = require('../../controllers/userScraperSetting');
const scrapedDataController = require('../../controllers/scrapedData');

// store global variable to make it easier to change the scraper name
const scraperName = 'klick';
const linkRegex = /^(https:\/\/)?(www\.)?klick\.ee\/[a-zA-Z0-9\-]+$/;

/* 
    @KLICK SCRAPER:
    - scraperName: klick
    - scraper data: price, discount

*/

router.post(`/${scraperName}`, checkAuthenticated, async (req, res) => {
    try {
        const { link, scraperData } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        if (!linkRegex.test(link)) {
            return res.status(400).json({ message: 'Invalid link format' });
        }

        if(!scraperData || scraperData.length === 0) {
            return res.status(400).json({ message: 'Scraper data is required' });
        }

        // @note: scraper_data = table of items to scraper ex: [price, discount]
        // @todo: unsafe, scraper_data should be validated

        const foundItem = await itemController.findItem(link);
        if(foundItem) {
            const settings = await userScraperSettingsController.getUserScraperSetting(req.session.user.id, foundItem.ID);
            if(settings) {
                return res.status(400).json({ message: 'You are already following this link' });
            } else {
                await userScraperSettingsController.createUserScraperSetting(req.session.user.id, foundItem.ID, scraperData);
            }
        } else {
            const newItem = await itemController.createItem(link, scraperName);
            await userScraperSettingsController.createUserScraperSetting(req.session.user.id, newItem.ID, scraperData);
        }

        return res.status(200).json({ message: 'Scraper entry added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete(`/${scraperName}`, checkAuthenticated, async (req, res) => {
    try {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        if (!linkRegex.test(link)) {
            return res.status(400).json({ message: 'Invalid link format' });
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

// testing endpoint to display data
router.get(`/${scraperName}`, checkAuthenticated, async (req, res) => {
    try
    {
        const scrapedData = await scrapedDataController.getScrapedDataForUser(req.session.user.id);
        const scrapeSettings = await userScraperSettingsController.getAllScrapeSettings(req.session.user.id);
        const filteredData = await Promise.all(scrapedData.map(async item => {
            const setting = await findSettingByLink(item.dataValues.link, scrapeSettings);
            if(setting) {
                const selectedParameters = setting.dataValues.selected_parameters;

                const excludeKeys = Object.keys(selectedParameters).filter(key => !selectedParameters[key]);

                const filteredDataObject = Object.keys(item.dataValues.data).reduce((result, key) => {
                    if (!excludeKeys.includes(key)) {
                        result[key] = item.dataValues.data[key];
                    }
                    return result;
                }, {});
    
                item.dataValues.data = filteredDataObject;
            }

            return item.dataValues.data;
        }));

        res.json(filteredData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

async function findSettingByLink(itemLink, scrapeSettings) {
    for (const setting of scrapeSettings) {
        const item = await itemController.findItemById(setting.dataValues.item_id);
        if (item.dataValues.link === itemLink) {
            return setting;
        }
    }
    return null;
}

module.exports = router;
