const express = require('express');
const router = express.Router();
const path = require('path');

const { checkNotAuthenticated, checkAuthenticated } = require('../../handlers/authMiddleware');
const { readCsvFile } = require('../../controllers/csvController');

// testing endpoint to display data
router.get('/klick/data', async (req, res) => {
    try
    {
        const filePath = path.join(__dirname, '../../scrapers/klick/scraperData.csv'); 
        const data = await readCsvFile(filePath);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
