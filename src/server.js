require('dotenv').config();

const express = require('express');
const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const cryptoJS = require('crypto-js');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  });
app.use(limiter);
  
  // CORS
  app.use(cors());
  
  // Body parser
  app.use(express.json());
  
  // Sequelize setup
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
  });
  
  // User model
  const User = sequelize.define('user', {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });

  // Sync database
  sequelize.sync().then(() => {
    console.log('Database & tables created!');
  });
  
  // Routes
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    try {
     const hashedPassword = bcrypt.hashSync(password, 8);
    await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });