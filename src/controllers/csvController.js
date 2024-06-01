const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

const csvFilePath = path.join(__dirname, '../scrapers/klick/scraperData.csv');

function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(require('csv-parser')())
            .on('data', (data) => rows.push(data))
            .on('end', () => resolve(rows))
            .on('error', (error) => reject(error));
    });
}

async function saveToCsv(records, fields, options = { debug: false }) {
    try {
        let existingData = [];
        if (fs.existsSync(csvFilePath)) {
            existingData = await readCsvFile(csvFilePath);

            for (const record of records) {
                const index = existingData.findIndex(item => item.link === record.link);
                if (index !== -1) {
                    existingData[index] = record;
                } else {
                    existingData.push(record);
                }
            }

            const csvData = parse(existingData, { fields });
            fs.writeFileSync(csvFilePath, csvData, 'utf8');

            if (options.debug)
                console.log('The CSV file was updated successfully.');
        } else {
            const csvData = parse(records, { fields });
            fs.writeFileSync(csvFilePath, csvData, 'utf8');

            if (options.debug)
                console.log('The CSV file was created and written successfully.');
        }

        if (options.debug)
            console.log('CSV save operation finished.');
    } catch (error) {
        if (options.debug)
            console.error('Error:', error);
    }
}

module.exports = { saveToCsv, readCsvFile };