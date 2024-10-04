require('dotenv').config();
const axios = require('axios');

async function getXoiAuthToken() {
    const apiUsersExternal = process.env.XOI_API_USERS_EXTERNAL_URL;
    const apiKey = process.env.XOI_API_KEY;
    const apiSecret = process.env.XOI_API_SECRET;

    try {
        const response = await axios.post(`${apiUsersExternal}/token`, {
            api_key: apiKey,
            api_secret: apiSecret
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const access_token  = response.data.token;
        console.log('Response code for XOi Auth:', response.status);
        //console.log('XOI Auth Token in xoiAuth.js:', response.data.token);
        return access_token;
    } catch (error) {
        console.error('Error fetching XOi auth token:', error.message);
        throw new Error('Failed to authenticate with XOi');
    }
}

module.exports = {
    getXoiAuthToken
};