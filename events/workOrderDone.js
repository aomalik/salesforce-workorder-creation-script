const axios = require('axios');
const { getRandomSalesforceId, getWorkOrderStatus } = require('../utils/salesforceUtils');

async function workOrderDoneFlow(accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;

        // Query to find a work order with status 'New' and has a service appointment attached
        const query = `SELECT Id FROM WorkOrder WHERE Status = 'New' AND Id IN (SELECT FSSK__FSK_Work_Order__c FROM ServiceAppointment) LIMIT 1`;
        var workOrderId;
        try {
            const response = await axios.get(
                `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.records.length === 0) {
                console.log('No work order with status "New" found.');
                return;
            }

            workOrderId = response.data.records[0].Id;
        }
        catch (error) {
            //console.error('Error response datas:', error.response?.data); // Log the response data if available
            throw new Error(`Failed to update work order status: ${error.message}`);
        }
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        await new Promise((resolve) => {
            rl.question('Enter Work Order ID (or press 0 to use the default work order): ', (inputWorkOrderId) => {
                if (inputWorkOrderId !== '0') {
                    workOrderId = inputWorkOrderId;
                }
                else{
                    console.log('Found work order with status "New" and service appointment attached with ID:', workOrderId);
                    
                }
                rl.close();
                
                resolve();
            });
        });

        console.log('Using work order id:', workOrderId);
        
        // Update the status of the found work order to 'Done'
        const updateData = {
            "Status": "Completed"
        };

        const updateResponse = await axios.patch(
            `${instanceUrl}/services/data/v61.0/sobjects/WorkOrder/${workOrderId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Work order status updated to "Done":', updateResponse.data);
    } catch (error) {
        console.error('Error updating work order status:', error.message);
        throw new Error(`Failed to update work order statushere: ${error.message}`);
    }
}

module.exports = { workOrderDoneFlow };