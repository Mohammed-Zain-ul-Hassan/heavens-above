// DailyScraper/index.js

// Import your existing scraper modules
const satellite = require('../src/satellite');
const iridium = require('../src/iridium');

// This is the main function that Azure will run on a schedule
module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();
    context.log('Azure Function App triggered!', timeStamp);

    try {
        // --- This is the logic from your run.js file ---
        
        context.log('Starting satellite data scrape...');
        await satellite.getTable({
            target: 25544, // ISS
            pages: 4,
            root: "./" // Azure Functions use a temporary local directory
        });
        context.log('Satellite scrape finished.');

        /*
        context.log('Starting Iridium flares data scrape...');
        await iridium.getTable({
            pages: 4,
            root: "./"
        });
        context.log('Iridium flares scrape finished.');
        */

        // --- End of run.js logic ---

    } catch (error) {
        context.log.error('An error occurred during the scrape:', error.message);
    }
};