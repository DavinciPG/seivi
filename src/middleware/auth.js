const checkNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.status(400).json({ message: 'You are already logged in' });
  }
  
  next();
};

const checkAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'You are not logged in' });
  }

  next();
};

module.exports = { checkNotAuthenticated, checkAuthenticated };