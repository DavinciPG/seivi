const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../database/models/user');
const { checkNotAuthenticated, checkAuthenticated } = require('../handlers/authMiddleware');

// Register route
router.post('/register', checkNotAuthenticated, async (req, res) => {
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

// Login route
router.post('/login', checkNotAuthenticated, async (req, res) => {
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

    // Save user information to the session
    req.session.user = {
      id: user.id,
      username: user.username,
    };

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', checkAuthenticated, (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      } else {
        return res.status(200).json({ message: 'Logout successful' });
      }
    });
  } else {
    return res.status(400).json({ message: 'No active session' });
  }
});

module.exports = router;
