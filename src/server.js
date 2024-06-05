require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const path = require('path');

// scraper
const ScraperController = require('./controllers/ScraperController');

// Import handlers
const corsHandler = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimiter');
const sessionHandler = require('./middleware/session');

// Import routes
const UserRouter = require('./routes/UserRouter');
const ScrapeRouter = require('./routes/ScraperRouter');

// Middleware
app.use(rateLimiter);
app.use(corsHandler);
app.use(express.json());
app.use(sessionHandler);

// @todo: remove when frontend is ready
app.use(express.static(path.join(__dirname, 'public')));

// run the scraper alongside the server
ScraperController.runAllScrapers();
setInterval(ScraperController.runAllScrapers, 1000 * 60 * 5);

// Handle Routes
app.use('/api', UserRouter);
app.use('/api', ScrapeRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});