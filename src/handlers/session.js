const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('../database');

// Session store
const sessionStore = new SequelizeStore({
  db: sequelize,
});

const sessionHandler = session({
  secret: process.env.SECRET_KEY,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
});

sessionStore.sync();

module.exports = sessionHandler;