require('dotenv').config();
const axios = require('axios');

class AuthSdk {
    constructor(authUrl) {
        this.endpoint = `${authUrl}/services/oauth2/token`;
    }

    async getToken(clientId, clientSecret) {
        try {
            const body = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            });
            const response = await axios.post(this.endpoint, body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const { access_token, instance_url } = response.data;
            return { accessToken: access_token, instanceUrl: instance_url };
        } catch (error) {
            throw new Error('Auth failed');
        }
    }
}

const authSdk = new AuthSdk(process.env.AUTH_URL);

async function getSalesforceAuthToken() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tokenData = await authSdk.getToken(clientId, clientSecret);
    return tokenData.accessToken;
}

module.exports = {
    getSalesforceAuthToken
};
