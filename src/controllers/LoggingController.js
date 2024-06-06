const BaseController = require('./BaseController');
const { models } = require('../database');

class LoggingController extends BaseController {
    constructor() {
        super();

        this.CreateLog = this.CreateLog.bind(this);
    }

    async CreateLog(link, type, message) {
        try {
            await models.Logging.create({
                link,
                type,
                message
            });
        } catch (error) {
            console.error('Error creating log:', error);
        }
    }
}

module.exports = new LoggingController();