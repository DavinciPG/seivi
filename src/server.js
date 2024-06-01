require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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

// Routes
app.use('/', routes);

// run the scraper alongside the server
loadScraperList().then(() => {
  runAllScrapers();
  setInterval(runAllScrapers, 1000 * 60); // every minute (note: not smart to make 1000000s of requests per minute but for now it's fine)
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});