const UserScraperSetting = require('../database/models/userScraperSetting');

async function getAllScrapeSettings(user_id) {
    try {
        const userScraperSettings = await UserScraperSetting.findAll({
            where: { user_id }
        });

        return userScraperSettings;
    } catch(error) {
        console.error(error);
    }

}

async function getUserScraperSetting(user_id, item_id) {
    try {
        const userScraperSetting = await UserScraperSetting.findOne({
            where: { user_id, item_id }
        });

        return userScraperSetting;
    } catch(error) {
        console.error(error);
    }
}

async function createUserScraperSetting(user_id, item_id, parameters) {
    try {
        const userScraperSetting = await UserScraperSetting.create({
            user_id,
            item_id,
            selected_parameters: JSON.parse(JSON.stringify(parameters))
        });

        return userScraperSetting;
    } catch(error) {
        console.error(error);
    }
}

module.exports = { getUserScraperSetting, createUserScraperSetting, getAllScrapeSettings };