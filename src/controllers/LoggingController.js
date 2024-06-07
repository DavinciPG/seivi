const BaseController = require('./BaseController');
const { models } = require('../database');

class LoggingController extends BaseController {
    constructor() {
        super();

        this.CreateLog = this.CreateLog.bind(this);
    }

    async CreateLog(link, type, message, options = {}) {
        const { transaction } = options;
        try {
            await models.Logging.create({
                link,
                type,
                message
            }, { transaction });
        } catch (error) {
            console.error('Error creating log:', error);
        }
    }
}

module.exports = new LoggingController();