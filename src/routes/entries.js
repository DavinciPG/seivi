const express = require('express');
const router = express.Router();

const { checkNotAuthenticated, checkAuthenticated } = require('../handlers/authMiddleware');

const userScraperSettingsController = require('../controllers/userScraperSetting');
const itemController = require('../controllers/itemController');

router.get('/', checkAuthenticated, async (req, res) => {
  try {
    const settings = await userScraperSettingsController.getAllScrapeSettings(req.session.user.id);
    const links = [];
    for(let setting of settings) {
        const item = await itemController.findItemById(setting.dataValues.item_id);
        links.push(item.dataValues.link);
    }

    res.json(links);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;