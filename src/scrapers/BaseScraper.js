const axios = require('axios');
const cheerio = require('cheerio');

const BrowserController = require('../controllers/BrowserController');

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
}

module.exports = BaseScraper;