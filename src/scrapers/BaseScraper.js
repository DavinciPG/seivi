const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
    async fetch(url) {
        const response = await axios.get(url);
        return { data: response.data, status: response.status };
    }
    
    async data(axios_data) {
        return cheerio.load(axios_data);
    }
}

module.exports = BaseScraper;