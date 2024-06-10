const BaseController = require('./BaseController');
const { models } = require('../database');

class NotificationController extends BaseController {
    constructor() {
        super();
        this.setSeenStatus = this.setSeenStatus.bind(this);
        this.setArchivedStatus = this.setArchivedStatus.bind(this);
        this.deleteNotification = this.deleteNotification.bind(this);
        this.getAllNotifications = this.getAllNotifications.bind(this);
    }

    async getAllNotifications(req, res) {
        this.handleRequest(req, res, async () => {
            const notifications = await models.Notification.findAll({
                where: {
                    userId: req.session.user.id
                },
                attributes: ['id', 'seen', 'archived', 'message', 'type'],
                order: [['time', 'DESC']]
            });

            return { success: true, data: notifications };
        });
    }

    async setSeenStatus(req, res) {
        this.handleRequest(req, res, async () => {
            const { id } = req.params;
            const { seen } = req.body;

            const notification = await models.Notification.findByPk(id);
            if (!notification) {
                return { success: false, error: 'Notification not found' };
            }

            await notification.update({
                seen
            });

            return { success: true, message: 'Seen status updated' };
        });
    }

    async setArchivedStatus(req, res) {
        this.handleRequest(req, res, async () => {
            const { id } = req.params;
            const { archived } = req.body;

            const notification = await models.Notification.findByPk(id);
            if (!notification) {
                return { success: false, error: 'Notification not found' };
            }

            if(notification.dataValues.user_id !== req.session.user.id) {
                return {success: false, error: 'You do not own this notification'};
            }

            await notification.update({
                archived
            });

            return { success: true, message: 'Archived status updated' };
        });
    }

    async deleteNotification(req, res) {
        this.handleRequest(req, res, async () => {
            const { id } = req.params;

            const notification = await models.Notification.findByPk(id);
            if (!notification) {
                return { success: false, error: 'Notification not found' };
            }

            if(notification.dataValues.user_id !== req.session.user.id) {
                return { success: false, error: 'You do not own this notification' };
            }

            await notification.destroy();

            return { success: true, message: 'Notification deleted' };
        });
    }
}

module.exports = new NotificationController();