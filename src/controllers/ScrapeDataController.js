const _ = require('lodash');

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
     * @returns {boolean} - True if the data was inserted, false otherwise.
     */
    async InsertScrapeData(link, json_data) {
        // @DavinciPG - @todo: Maybe implement validation?
        try {
            const existingData = await models.ScrapedData.findOne({
                where: {
                    link: link
                },
                order: [['scraped_at', 'DESC']]
            });

            if(existingData && _.isEqual(JSON.parse(existingData.dataValues.data), JSON.parse(json_data)))
                return false;

            const itemExists = await models.Item.findOne({
                where: { link: link }
            });

            if(!itemExists)
                return false;

            await models.ScrapedData.create({
                link: link,
                data: JSON.parse(json_data)
            });

            return true;
        } catch (error) {
            console.error('Error inserting scrape data:', error);
        }
    }
    async GetScrapeDataForUser(req, res) {
        this.handleRequest(req, res, async () => {
            // finish this
            const data = await models.ScrapedData.findAll({
                attributes: ['link', 'data', 'scraped_at'],
                order: [['link'], ['scraped_at', 'DESC']]
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