const express = require('express');
const router = express.Router();

const { checkNotAuthenticated, checkAuthenticated } = require('../../handlers/authMiddleware');

const Item = require('../../database/models/item');
const itemController = require('../../controllers/itemController');
const userScraperSettingsController = require('../../controllers/userScraperSetting');
const scrapedDataController = require('../../controllers/scrapedData');

// store global variable to make it easier to change the scraper name
const scraperName = 'klick';
const linkRegex = /^(https:\/\/)?www\.klick\.ee\/.*$/;

/* 
    @KLICK SCRAPER:
    - scraperName: klick
    - scraper data: price, discount
*/

// @todo: @DavinciPG - I will leave optimization to the big man @treumuth

const defaultJson = {
    "price": true,
    "discount": true
};

const isValidScraperData = (scraperData) => {
    const keys = Object.keys(scraperData);
    const defaultKeys = Object.keys(defaultJson);
    
    if (keys.length !== defaultKeys.length) {
        return false;
    }

    for (let key of keys) {
        if (!defaultJson.hasOwnProperty(key)) {
            return false;
        }
    }

    return true;
};

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

        if (!isValidScraperData(scraperData)) {
            return res.status(400).json({ message: 'Invalid scraper data format' });
        }

        // @note: scraperData = table of items to scraper ex: [price, discount]
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

module.exports = router;
