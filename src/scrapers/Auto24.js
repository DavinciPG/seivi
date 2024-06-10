const BaseScraper = require('./BaseScraper');

class Auto24Scraper extends BaseScraper {
    async scrape(Entry, Options) {
        return await this.performScrape(Entry, $ => {
            const errorMessage = $('.e-message.-error.t-fs-xl.t-mb-m').text().trim();
            if (errorMessage === 'Kuulutus ei ole aktiivne!') {
                // @DavinciPG - algest hodisin seda invalidina, tegelt ei tohiks, võiks kasutajat teavitada, et kuultus on mitte aktiivne ühe korra? @REF ID: 1
                return { error: "Entry invactive" };
            }

            const hind = $('tr.field-hind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();
            const soodus_hind = $('tr.field-soodushind .value').text().replace(/\u00a0/g, '').replace('EUR', '€').trim();

            return { price: soodus_hind.length > 0 ? soodus_hind : hind };
        });
    }
}

module.exports = new Auto24Scraper();