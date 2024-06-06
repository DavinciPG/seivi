const BaseScraper = require('./BaseScraper');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        try {
            const { data, status } = await this.fetch(Entry.link, { 
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            });

            if(status == 404) {
                Entry.invalid = true;
                return { error: 'Page Not Found' };
            }

            const $ = await this.data(data);

            // @note: unused atm idk if we need it
            const hind = $('tr.field-hind .value').text().trim();

            const soodus_hind = $('tr.field-soodushind .value').text().trim();

            return {
                price: soodus_hind
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new Auto24Scraper();