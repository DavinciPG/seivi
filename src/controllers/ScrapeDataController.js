const _ = require('lodash');

const { Op, QueryTypes } = require('sequelize');
const { models } = require('../database');
const BaseController = require('./BaseController');

class ScrapeDataController extends BaseController {
    constructor() {
        super();

        this.InsertScrapeData = this.InsertScrapeData.bind(this);
        this.GetScrapeDataForUser = this.GetScrapeDataForUser.bind(this);
        this.GetScrapeDataForLink = this.GetScrapeDataForLink.bind(this);
    }

    /**
     * Logs error details for debugging.
     * @param link - The item link
     * @param {JSON} json_data - The JSON data from the scrape
     * @returns {JSON} - Success parameter boolean, TYPE what failed
     */
    async InsertScrapeData(link, json_data, options = {}) {
        const { transaction } = options;
        try {
            const existingData = await models.ScrapedData.findOne({
                where: {
                    link: link
                },
                order: [['scraped_at', 'DESC']],
                transaction
            });

            if(existingData && _.isEqual(JSON.parse(existingData.dataValues.data), json_data))
                return { success: false, type: 'EQUAL' };

            const itemExists = await models.Item.findOne({
                where: { link: link },
                transaction
            });

            if(!itemExists)
                return { success: false, type: 'INVALID' };

            await models.ScrapedData.create({
                link: link,
                data: json_data
            }, { transaction });

            return { success: true, type: 'SUCCESS' };
        } catch (error) {
            console.error('Error inserting scrape data:', error);
            return { success: false, type: 'ERROR' };
        }
    }
    async GetScrapeDataForUser(req, res) {
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

            const links = [];
            for(const Setting of UserSettings) {
                links.push(Setting.dataValues.Item.link);
            }

            // finish this
            const query = `
            SELECT s1.*
            FROM ScrapedData s1
            WHERE s1.id IN (
                SELECT id
                FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY link ORDER BY scraped_at DESC) as row_num
                    FROM ScrapedData
                    WHERE link IN (:links)
                ) s2
                WHERE s2.row_num <= 2
            )
            ORDER BY s1.link, s1.scraped_at DESC
        `;

            const data = await models.sequelize.query(query, {
                replacements: { links },
                type: QueryTypes.SELECT
            });

            res.json(data);
        });
    }
    async GetScrapeDataForLink(req, res) {
        this.handleRequest(req, res, async () => {
            const { link } = req.query;

            if (!link) {
                return res.status(400).json({ error: 'Link parameter is required' });
            }

            const data = await models.ScrapedData.findAll({
                where: {
                    link: link
                },
                attributes: ['link', 'data', 'scraped_at'],
                order: [['scraped_at', 'DESC']]
            });

            res.json(data);
        });
    }
}

module.exports = new ScrapeDataController();