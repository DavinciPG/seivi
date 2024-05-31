require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});