const BaseController = require('./BaseController');
const { models } = require('../database');

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const crypto = require('crypto');
const nodemailer = require('nodemailer');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class UserController extends BaseController {
    constructor() {
        super();

        this.createUser = this.createUser.bind(this);
        this.createSession = this.createSession.bind(this);
        this.deleteSession = this.deleteSession.bind(this);
        this.getSession = this.getSession.bind(this);
    }

    async createUser(req, res) {
        this.handleRequest(req, res, async () => {
            const { username, email, password} = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ success: false, error: 'Username, email, and password are required' });
            }

            if (username.length < 3 || username.length > 15) {
                return res.status(400).json({ success: false, error: 'Username must be between 3 and 15 characters' });
            }

            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, error: 'Invalid email format' });
            }

            if (password.length < 8 || password.length > 65) {
                return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long and no longer than 65 characters' });
            }

            const existingUser = await models.User.findAll({
                where: {
                    [Op.or]: [
                        { email: email },
                        { username: username }
                    ]
                }
            });

            if(existingUser.length > 0) {
                return res.status(400).json({ success: false, error: 'Email OR username already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await models.User.create({
                username,
                email,
                password: hashedPassword
            });

            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email
            }

            return res.status(201).json({ success: true, message: 'User created and logged in to session' });
        });
    }
    async createSession(req, res) {
        this.handleRequest(req, res, async () => {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({ success: false, error: 'Username/email and password are required' });
            }

            const user = await models.User.findOne({
                where: {
                    [Op.or]: [
                        { email: identifier },
                        { username: identifier }
                    ]
                }
            });

            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email
            }

            return res.status(200).json({ success: true, message: 'Registered session' });
        });
    }
    async deleteSession(req, res) {
        this.handleRequest(req, res, async () => {
            req.session.destroy(err => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Logout failed' });
                }

                return res.status(200).json({ success: true, message: 'Logout successful' });
            });
        });
    }
    async getSession(req, res) {
        this.handleRequest(req, res, async () => {
            return res.status(200).json({ user: req.session.user });
        });
    }

    async forgotPassword(req, res) {
      const { email } = req.body;
      try {
        const user = await models.User.findOne({ where: { email } });
        if (!user) {
          return res.status(404).json({ message: 'Kasutajat ei leitud' });
        }
    
        const token = crypto.randomBytes(20).toString('hex');
        const resetPasswordToken = token;
        const resetPasswordExpires = Date.now() + 3600000; // 1 tund
    
        await user.update({ resetPasswordToken, resetPasswordExpires });
    
        const transporter = nodemailer.createTransport({
          sendmail: true,
          newline: 'unix',
          path: '/usr/sbin/sendmail',
        });
    
        const mailOptions = {
          to: user.email,
          from: 'noreply@codeweb.ee',
          subject: 'Parooli lähtestamine',
          text: `Olete saanud selle e-kirja, kuna teie (või keegi teine) on taotlenud teie konto parooli lähtestamist.\n\n
            Palun klõpsake järgmisel lingil või kleepige see oma brauserisse, et protsessi lõpule viia:\n\n
            http://${req.headers.host}/reset/${token}\n\n
            Kui te seda ei taotlenud, siis ignoreerige seda e-kirja ja teie parool jääb muutumatuks.\n`,
        };
    
        await transporter.sendMail(mailOptions);
    
        res.status(200).json({ message: 'Parooli lähtestamise link saadetud' });
      } catch (error) {
        res.status(500).json({ message: 'Viga e-kirja saatmisel', error });
      }
    }
       
    async resetPassword(req, res) {
        const { token } = req.params;
        const { password } = req.body;
        try {
          const user = await models.User.findOne({
            where: {
              resetPasswordToken: token,
              resetPasswordExpires: { [Op.gt]: Date.now() },
            },
          });
    
          if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
          }
    
          const hashedPassword = await bcrypt.hash(password, 10);
          user.password = hashedPassword;
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
    
          await user.save();
    
          res.status(200).json({ message: 'Password has been reset' });
        } catch (error) {
          res.status(500).json({ message: 'Error in resetting password', error });
        }
    }
}

module.exports = new UserController();