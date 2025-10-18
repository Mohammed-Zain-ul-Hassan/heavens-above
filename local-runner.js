// local-runner.js

// This script is for local testing. It mimics what the Azure Function does.
const satellite = require('./src/satellite');
const iridium = require('./src/iridium');

async function runLocalScraper() {
    console.log('--- Starting Local Scraper Run ---');

    try {
        console.log('Starting satellite data scrape...');
        await satellite.getTable({
            target: 25544, // ISS
            pages: 4,
            root: "./"
        });
        console.log('Satellite scrape finished.');

        /* Uncomment this block to run the Iridium scraper
        console.log('Starting Iridium flares data scrape...');
        await iridium.getTable({
            pages: 4,
            root: "./"
        });
        console.log('Iridium flares scrape finished.');
        */

    } catch (error) {
        console.error('An error occurred during the local scrape:', error.message);
    }
    
    console.log('--- Local Scraper Run Finished ---');
}

runLocalScraper();