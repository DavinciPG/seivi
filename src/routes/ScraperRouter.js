const BaseRouter = require('./BaseRouter');
const ScrapeDataController = require('../controllers/ScrapeDataController');
const ItemController = require('../controllers/ItemController');

const { checkNotAuthenticated, checkAuthenticated } = require('../middleware/auth');

class ScrapeRouter extends BaseRouter {
    constructor() {
        super();
        this.registerRoutes();
    }

    registerRoutes() {
        this.registerRoute('get', '/scraping/user/data', checkAuthenticated, ScrapeDataController.GetScrapeDataForUser);
        this.registerRoute('get', '/scraping/link/data', checkAuthenticated, ScrapeDataController.GetScrapeDataForLink); // this takes a query parameter

        this.registerRoute('get', '/scraping/user/items', checkAuthenticated, ItemController.GetAllItemsForUser);
    }
}

module.exports = new ScrapeRouter().getRouter();