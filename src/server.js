require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const path = require('path');

// scraper
const { loadScraperList } = require('./scrapers/list');
const { runAllScrapers } = require('./controllers/scraperController');

// Import handlers
const corsHandler = require('./handlers/cors');
const rateLimiter = require('./handlers/rateLimiter');
const sessionHandler = require('./handlers/session');

// Import routes
const routes = require('./routes');

// Middleware
app.use(rateLimiter);
app.use(corsHandler);
app.use(express.json());
app.use(sessionHandler);

// @todo: remove when frontend is ready
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);

// run the scraper alongside the server
loadScraperList().then(() => {
  runAllScrapers();
  setInterval(runAllScrapers, 1000 * 60 * 5); // call this every 5 minutes
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});