const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const { runAllScrapers } = require('../../controllers/scraperController');

router.get('/klick', async (req, res) => {
    try
    {
        await runAllScrapers();
        res.status(200).json({ message: 'Scraping completed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
