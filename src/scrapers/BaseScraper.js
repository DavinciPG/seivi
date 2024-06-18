const axios = require('axios');
const cheerio = require('cheerio');

const BrowserController = require('../controllers/BrowserController');
const {Op} = require("sequelize");

class BaseScraper {
    async fetch_axios(url, options = null) {
        try {
            const response = await axios.get(url, options);
            return { data: response.data, status: response.status };
        } catch (error) {
            if (error.response) {
                return { data: null, status: error.response.status };
            } else {
                throw new Error(error.message);
            }
        }
    }

    async cheerio_data(html) {
        try {
            return await cheerio.load(html);
        } catch(error) {
            throw new Error(error.message);
        }
    }

    async performScrape(Entry, browserController, Options, parseFunction) {
        try {
            const response = await this.fetch_axios(Entry.link);

            if (response.status === 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            let $;
            if (response.status === 200) {
                $ = await this.cheerio_data(response.data);
            } else {
                const { link, loadTime, statusCode, pageContent } = await browserController.scrape(Entry.link);
                if (statusCode !== 200) {
                    return { error: 'Failed Loading Page' };
                }

                console.log(`${link} took ${loadTime}ms`);

                $ = await this.cheerio_data(pageContent);
            }

            return parseFunction($);
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = BaseScraper;