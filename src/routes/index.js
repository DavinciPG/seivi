const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const klickRoute = require('./scraping/klick');

router.use(authRoutes);
router.use('/scrapers/', klickRoute);

module.exports = router;