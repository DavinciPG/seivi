const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const klickRoute = require('./scraping/klick');
const euronicsRoute = require('./scraping/euronics');

router.use(authRoutes);
router.use('/scrapers/', klickRoute);
router.use('/scrapers/', euronicsRoute);

module.exports = router;