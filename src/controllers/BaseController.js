// @DavinciPG - @todo: Log errors into a log file

class BaseController {
    handleRequest(req, res, callback) {
        try {
            callback(req, res);
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Internal Server Error.' });
        }
    }
}

module.exports = BaseController;