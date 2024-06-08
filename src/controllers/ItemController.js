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
                attributes: ['user_id', 'item_id', 'selected_parameters'],
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
                return res.status(400).json({ error: 'Link is required' });
            }

            const Item = await models.Item.findOne({
                where: {
                    link
                }
            });

            if(!Item) {
                return res.status(404).json({ error: 'Item not found' });
            }

            const UserSetting = await models.UserScraperSetting.findOne({
                where: {
                    user_id: req.session.user.id,
                    item_id: Item.id
                }
            });

            if(!UserSetting) {
                return res.status(404).json({ error: 'User setting not found' });
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
            const { link, selected_parameters } = req.body;

            if(!link || !selected_parameters) {
                return res.status(400).json({ error: 'Link and selected_parameters are required' });
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
                return res.status(400).json({ error: 'No matching scraper found for the provided link' });
            }

            const scraper = scraperList[scraperType];
            if (!scraper) {
                return res.status(400).json({ error: 'Invalid scraperType' });
            }

            const ScraperModel = await models.Scraper.findOne({
                where: {
                    name: scraperType
                },
                attributes: ['supported_parameters']
            });

            if (!ScraperModel) {
                return res.status(400).json({ error: 'Scraper not found in database' });
            }

            const SupportedParameters = JSON.parse(ScraperModel.supported_parameters);
            for (const param of Object.keys(selected_parameters)) {
                if (!SupportedParameters[param]) {
                    return res.status(400).json({ error: `Parameter '${param}' is not supported by the selected scraper` });
                }
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
                return res.status(400).json({ error: 'User setting already exists' });
            }

            await models.UserScraperSetting.create({
                user_id: req.session.user.id,
                item_id: Item.id,
                selected_parameters
            });

            res.json({ success: true });
        });
    }
    async UpdateItem(req, res) {
        this.handleRequest(req, res, async () => {
            const { link, selected_parameters } = req.body;

            if(!link || !selected_parameters) {
                return res.status(400).json({ error: 'Link and selected_parameters are required' });
            }

            const ItemModel = await models.Item.findOne({
                where: {
                    link
                }
            });

            if(!ItemModel) {
                return res.status(404).json({ error: 'Item not found' });
            }

            const ScraperModel = await models.Scraper.findOne({
                where: {
                    name: scraperType
                },
                attributes: ['supported_parameters']
            });

            if (!ScraperModel) {
                return res.status(400).json({ error: 'Scraper not found in database' });
            }

            const SupportedParameters = JSON.parse(ScraperModel.supported_parameters);
            for (const param of Object.keys(selected_parameters)) {
                if (!SupportedParameters[param]) {
                    return res.status(400).json({ error: `Parameter '${param}' is not supported by the selected scraper` });
                }
            }

            const UserSetting = await models.UserScraperSetting.findOne({
                where: {
                    user_id: req.session.user.id,
                    item_id: Item.id
                }
            });

            if(!UserSetting) {
                return res.status(404).json({ error: 'User setting not found' });
            }

            await UserSetting.update({
                selected_parameters
            });

            res.json({ success: true });
        });
    }
}

module.exports = new ItemController();