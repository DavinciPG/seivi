const BaseController = require('./BaseController');
const { models } = require('../database');

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class UserController extends BaseController {
    constructor() {
        super();

        this.createUser = this.createUser.bind(this);
        this.createSession = this.createSession.bind(this);
        this.deleteSession = this.deleteSession.bind(this);
    }

    async createUser(req, res) {
        this.handleRequest(req, res, async () => {
            const { username, email, password} = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Username, email, and password are required' });
            }

            if (username.length < 3 || username.length > 15) {
                return res.status(400).json({ error: 'Username must be between 3 and 15 characters' });
            }

            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (password.length < 8 || password.length > 65) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long and no longer than 65 characters' });
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
                return res.status(400).json({ error: 'Email OR username already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await models.User.create({
                username,
                email,
                password: hashedPassword
            });

            req.session.user = {
                id: user.ID,
                username: user.username,
                email: user.email
            }

            return res.status(201).json({ message: 'User created and logged in to session' });
        });
    }
    async createSession(req, res) {
        this.handleRequest(req, res, async () => {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({ error: 'Username/email and password are required' });
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
                return res.status(401).json({ error: 'Invalid username/email or password' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid username/email or password' });
            }

            req.session.user = {
                id: user.ID,
                username: user.username,
                email: user.email
            }

            return res.status(200).json({ message: 'Registered session' });
        });
    }
    async deleteSession(req, res) {
        this.handleRequest(req, res, async () => {
            req.session.destroy(err => {
                if (err) {
                    return res.status(500).json({ message: 'Logout failed' });
                }

                return res.status(200).json({ message: 'Logout successful' });
            });
        });
    }
}

module.exports = new UserController();