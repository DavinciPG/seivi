const BaseRouter = require('./BaseRouter');
const NotificationController = require('../controllers/NotificationController');

const { checkNotAuthenticated, checkAuthenticated } = require('../middleware/auth');

class NotificationRouter extends BaseRouter {
    constructor() {
        super();
        this.registerRoutes();
    }

    registerRoutes() {
        this.registerRoute('get', '/notifications', checkAuthenticated, NotificationController.getAllNotifications);
        this.registerRoute('put', '/notifications/:id/seen', checkAuthenticated, NotificationController.setSeenStatus); // id param seen body
        this.registerRoute('put', '/notifications/:id/archived', checkAuthenticated, NotificationController.setArchivedStatus); // id param archived body
        this.registerRoute('delete', '/notifications/:id', checkAuthenticated, NotificationController.deleteNotification); // id param
    }
}

module.exports = new NotificationRouter().getRouter();