const cors = require('cors');

const corsOptions = {
  origin: [],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);