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
        this.registerRoute('put', '/scraping/item', checkAuthenticated, ItemController.UpdateItem); // takes body { link, selected_parameters }
        this.registerRoute('post', '/scraping/item', checkAuthenticated, ItemController.CreateItem); // takes body { link, selected_parameters }
        this.registerRoute('delete', '/scraping/item', checkAuthenticated, ItemController.DeleteItem); // takes body { link }
    }
}

module.exports = new ScrapeRouter().getRouter();