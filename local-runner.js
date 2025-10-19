// local-runner.js


// Polyfill to resolve 'ReferenceError: File is not defined' in older Node environments (e.g., Node 18.x)
if (typeof global.File === 'undefined') {
    global.File = class File extends Blob {
        constructor(parts, filename, properties) {
            super(parts, properties);
            this.name = filename;
        }
    };
}

// Global polyfill for Blob, as File extends it and it might also be missing
if (typeof global.Blob === 'undefined') {
    global.Blob = class Blob {};
}

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