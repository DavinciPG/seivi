const express = require('express');
const router = express.Router();

const { checkNotAuthenticated, checkAuthenticated } = require('../../handlers/authMiddleware');
const { readCsvFile } = require('../../controllers/csvController');

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

router.post(`/${scraperName}/new`, checkAuthenticated, async (req, res) => {
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

// testing endpoint to display data
router.get(`/${scraperName}/data`, checkAuthenticated, async (req, res) => {
    try
    {
        const scrapedData = await scrapedDataController.getScrapedDataForUser(req.session.user.id);
        const scrapeSettings = await userScraperSettingsController.getAllScrapeSettings(req.session.user.id);
        const filteredData = scrapedData.map(item => {
            const data = item.dataValues.data;
            const itemId = item.dataValues.item_id;

            const setting = scrapeSettings.find(setting => setting.dataValues.item_id === itemId);
            if(setting) {
                const selectedParameters = setting.dataValues.selected_parameters;

                const excludeKeys = Object.keys(selectedParameters).filter(key => !selectedParameters[key]);

                const filteredDataObject = Object.keys(data).reduce((result, key) => {
                    if (!excludeKeys.includes(key)) {
                        result[key] = data[key];
                    }
                    return result;
                }, {});
    
                item.dataValues.data = filteredDataObject;
            }

            return item.dataValues.data;
        });

        res.json(filteredData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
