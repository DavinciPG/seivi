const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
    async fetch(url, ...options) {
        try {
            const response = await axios.get(url, {
                ...options
            });
            return { data: response.data, status: response.status };
        } catch (error) {
            if (error.response) {
                return { data: null, status: error.response.status };
            } else {
                throw new Error(error.message);
            }
        }
    }
    
    async data(axios_data) {
        return cheerio.load(axios_data);
    }
}

module.exports = BaseScraper;