const { models } = require('../database');
const BaseController = require('./BaseController');
const ScraperController = require('./ScraperController');

class ItemController extends BaseController {
    constructor() {
        super();

        this.GetAllItemsForUser = this.GetAllItemsForUser.bind(this);
        this.UpdateItem = this.UpdateItem.bind(this);
        this.CreateItem = this.CreateItem.bind(this);
        this.DeleteItem = this.DeleteItem.bind(this);
    }
    async GetAllItemsForUser(req, res) {
        this.handleRequest(req, res, async () => {
            const UserSettings = await models.UserScraperSetting.findAll({
                attributes: ['user_id', 'item_id'],
                where: {
                    user_id: req.session.user.id
                },
                include: [{
                    model: models.Item,
                    attributes: ['link']
                }]
            });

            if(UserSettings.length === 0)
                return res.json([]);

            const filteredUserSettings = UserSettings.map(setting => {
                const { user_id, item_id, ...rest } = setting.get({ plain: true });
                return rest;
            });
    
            res.json(filteredUserSettings);
        });
    }
    async DeleteItem(req, res) {
        this.handleRequest(req, res, async () => {
            const { link } = req.body;

            if(!link) {
                return res.status(400).json({ success: false, error: 'Link is required' });
            }

            const Item = await models.Item.findOne({
                where: {
                    link
                }
            });

            if(!Item) {
                return res.status(404).json({ success: false, error: 'Item not found' });
            }

            const UserSetting = await models.UserScraperSetting.findOne({
                where: {
                    user_id: req.session.user.id,
                    item_id: Item.id
                }
            });

            if(!UserSetting) {
                return res.status(404).json({ success: false, error: 'User setting not found' });
            }

            await UserSetting.destroy();

            // @DavinciPG - extra checks to see if the item is used by other users
            const OtherUserSettings = await models.UserScraperSetting.findAll({
                where: {
                    item_id: Item.id
                }
            });

            if(OtherUserSettings.length === 0) {
                await Item.destroy();
            }

            res.json({ success: true });
        });
    }
    async CreateItem(req, res) {
        this.handleRequest(req, res, async () => {
            const { link } = req.body;

            if(!link) {
                return res.status(400).json({ success: false, error: 'Link is required' });
            }

            const scraperList = await ScraperController.GetScrapers();
            let scraperType = null;
            for (const [type, scraper] of Object.entries(scraperList)) {
                if (scraper.regex.test(link)) {
                    scraperType = type;
                    break;
                }
            }

            if (!scraperType) {
                return res.status(400).json({ success: false, error: 'No matching scraper found for the provided link' });
            }

            const scraper = scraperList[scraperType];
            if (!scraper) {
                return res.status(400).json({ success: false, error: 'Invalid scraperType' });
            }

            const ScraperModel = await models.Scraper.findOne({
                where: {
                    name: scraperType
                }
            });

            if (!ScraperModel) {
                return res.status(400).json({ success: false, error: 'Scraper not found in database' });
            }

            let Item = await models.Item.findOne({
                where: {
                    link
                }
            });

            if(!Item) {
                Item = await models.Item.create({
                    link,
                    scraper_id: scraper.id
                });
            }

            const UserSetting = await models.UserScraperSetting.findOne({
                where: {
                    user_id: req.session.user.id,
                    item_id: Item.id
                }
            });

            if(UserSetting) {
                return res.status(400).json({ success: false, error: 'User setting already exists' });
            }

            await models.UserScraperSetting.create({
                user_id: req.session.user.id,
                item_id: Item.id
            });

            res.json({ success: true });
        });
    }

    // at the moment unused, unsure what to update for item
    async UpdateItem(req, res) {
        this.handleRequest(req, res, async () => {
            const { link } = req.body;

            if(!link) {
                return res.status(400).json({ success: false, error: 'Link is required' });
            }

            const ItemModel = await models.Item.findOne({
                where: {
                    link
                }
            });

            if(!ItemModel) {
                return res.status(404).json({ success: false, error: 'Item not found' });
            }

            const ScraperModel = await models.Scraper.findOne({
                where: {
                    name: scraperType
                }
            });

            if (!ScraperModel) {
                return res.status(400).json({ success: false, error: 'Scraper not found in database' });
            }

            const UserSetting = await models.UserScraperSetting.findOne({
                where: {
                    user_id: req.session.user.id,
                    item_id: Item.id
                }
            });

            if(!UserSetting) {
                return res.status(404).json({ success: false, error: 'User setting not found' });
            }

            await UserSetting.update({

            });

            res.json({ success: true });
        });
    }
}

module.exports = new ItemController();