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
    
    async data(url, options = null) {
        try{    
            const { data, status } = await this.fetch_axios(url, options);
            return { data: cheerio.load(data), status };
        } catch(error) {
            throw new Error(error.message);
        }
    }

    async data_puppeteer(url, headers = null) {
        try {
            const data = BrowserController.GetPageContent(url, headers);
            return cheerio.load(data);
        } catch(error) {
            throw new Error(error.message);
        }
    }
}

module.exports = BaseScraper;