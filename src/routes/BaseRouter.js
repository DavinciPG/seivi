class BaseRouter {
    constructor() {
        this.router = require('express').Router();
    }

    registerRoute(method, path, ...handlers) {
        this.router[method](path, ...handlers);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = BaseRouter;