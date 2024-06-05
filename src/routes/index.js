const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const klickRoute = require('./scraping/klick');
const euronicsRoute = require('./scraping/euronics');
const entriesRoute = require('./entries');
const scrapersRoute = require('./scraper');

router.use(authRoutes);
router.use('/scrapers', klickRoute);
router.use('/scrapers', euronicsRoute);
router.use('/entries', entriesRoute);
router.use('/scrapers', scrapersRoute);

module.exports = router;