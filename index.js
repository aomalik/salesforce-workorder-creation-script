require('dotenv').config();  // Load environment variables

const axios = require('axios');
const { getSalesforceAuthToken } = require('./utils/auth');


// Main function
function main() {
    console.log('Starting...');
    getSalesforceAuthToken().then(accessToken => {
        if (accessToken) {
            console.log('Access token:', accessToken);
        }
    }).catch(error => {
        console.error('Error getting access token', error);
    });
}

main();
