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
const morgan = require('morgan');
const path = require('path');

// Import routes
const UserRouter = require('./routes/UserRouter');
const ScrapeRouter = require('./routes/ScraperRouter');
const NotificationRouter = require('./routes/NotificationRouter');

// trust the first proxy
app.set('trust proxy', 1);

// Middleware
app.use(rateLimiter);
app.use(corsHandler);
app.use(express.json());
app.use(sessionHandler);
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')))

// run the scraper alongside the server
/*ScraperController.runAllScrapers();
setInterval(() => {
  ScraperController.runAllScrapers();
}, 1000 * 60 * 30);*/

// Handle Routes
app.use('/api', UserRouter);
app.use('/api', ScrapeRouter);
app.use('/api', NotificationRouter);

app.get('/', (req, res) => {
  res.send('index.html');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});