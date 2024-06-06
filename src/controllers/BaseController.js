// @DavinciPG - @note: not gonna log anything here, we will log all we need when we need it

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