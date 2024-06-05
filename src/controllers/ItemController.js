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

            if(UserSettings.length === 0) {
                return res.json([]);
            }

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
            const { link, scraperType, selected_parameters } = req.body;

            if(!link || !scraperType || !selected_parameters) {
                return res.status(400).json({ error: 'Link, scraperType and selected_parameters are required' });
            }

            // @DavinciPG - @todo: check if link is valid and regex for each scraper

            let Item = await models.Item.findOne({
                where: {
                    link
                }
            });

            // @DavinciPG - @todo: check scraperType against available scrapers, how I am doing it rn is risky
            if(!Item) {
                Item = await models.Item.create({
                    link,
                    scraper_id: (await ScraperController.GetScrapers()).findIndex(scraper => scraper === scraperType) + 1
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

            await UserSetting.update({
                selected_parameters
            });

            res.json({ success: true });
        });
    }
}

module.exports = new ItemController();