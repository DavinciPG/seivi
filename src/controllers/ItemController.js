const { models } = require('../database');
const BaseController = require('./BaseController');

class ItemController extends BaseController {
    constructor() {
        super();

        this.GetAllItemsForUser = this.GetAllItemsForUser.bind(this);
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
}

module.exports = new ItemController();