const BaseRouter = require('./BaseRouter');
const UserController = require('../controllers/UserController');

const { checkNotAuthenticated, checkAuthenticated } = require('../middleware/auth');

class UserRouter extends BaseRouter {
    constructor() {
        super();
        this.registerRoutes();
    }

    registerRoutes() {
        this.registerRoute('post', '/users', checkNotAuthenticated, UserController.createUser);
        this.registerRoute('post', '/sessions', checkNotAuthenticated, UserController.createSession);
        this.registerRoute('delete', '/sessions', checkAuthenticated, UserController.deleteSession);
        this.registerRoute('get', '/sessions', checkAuthenticated, UserController.getSession);
    }
}

module.exports = new UserRouter().getRouter();