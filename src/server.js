require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// scraper
const ScraperController = require('./controllers/ScraperController');

// Import handlers
const corsHandler = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimiter');
const sessionHandler = require('./middleware/session');

// Import routes
const UserRouter = require('./routes/UserRouter');
const ScrapeRouter = require('./routes/ScraperRouter');

// trust the first proxy
app.set('trust proxy', 1);

// Middleware
app.use(rateLimiter);
app.use(corsHandler);
app.use(express.json());
app.use(sessionHandler);

// run the scraper alongside the server
ScraperController.runAllScrapers();
setInterval(ScraperController.runAllScrapers, 1000 * 60 * 30);

// Handle Routes
app.use('/api', UserRouter);
app.use('/api', ScrapeRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});