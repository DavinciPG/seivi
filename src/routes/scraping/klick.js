const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { checkNotAuthenticated, checkAuthenticated } = require('../../handlers/authMiddleware');
const { readCsvFile } = require('../../controllers/csvController');

const scraperList = require('../../scrapers/list');

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
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link is required' });
        }

        if (!linkRegex.test(link)) {
            return res.status(400).json({ message: 'Invalid link format' });
        }

        const addedEntry = await scraperList.addScraperEntry({ link, scraper: scraperName }, req.session.user.id);

        if(addedEntry)
            res.status(200).json({ message: 'Scraper entry added successfully' });
        else
            res.status(400).json({ message: 'You are already following this link' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// testing endpoint to display data
router.get(`/${scraperName}/data`, checkAuthenticated, async (req, res) => {
    try
    {
        const filePath = path.join(__dirname, '../../scrapers/klick/scraperData.csv'); 
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Data file not found' });
        }

        const data = await readCsvFile(filePath);
        const filteredData = data.filter(item => item.users && item.users.includes(req.session.user.id));

        // we don't want to leak other people :)
        const cleanedData = filteredData.map(({ users, ...rest }) => rest);

        res.json(cleanedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
