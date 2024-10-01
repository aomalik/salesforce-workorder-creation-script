const axios = require('axios');
const { getRandomSalesforceId, getWorkOrderStatus, createServiceAppointment, updateServiceAppointment } = require('../utils/salesforceUtils');

async function workOrderReadyFlow(accessToken) {
    try {
        const accountId = await getRandomSalesforceId('Account', accessToken);
        const contactId = await getRandomSalesforceId('Contact', accessToken);
        const workTypeId = await getRandomSalesforceId('WorkType', accessToken);
        console.log("I've got accountId, contactId, workTypeId", accountId, contactId, workTypeId);
        
        const workOrderData = {
            "Subject": "Routine Maintenance",
            "Description": "Perform routine maintenance on HVAC system",
            "Status": "New",
            "Priority": "High",
            "AccountId": accountId,
            "ContactId": contactId,
            "WorkTypeId": workTypeId,
            "Street": "123 Main St",
            "City": "New York",
            "State": "NY",
            "PostalCode": "10001",
            "Country": "USA"
        };

        const instanceUrl = process.env.INSTANCE_URL;
        const response = await axios.post(
            `${instanceUrl}/services/data/v61.0/sobjects/WorkOrder`,
            workOrderData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Work order created:', response.data);

        const workOrderId = response.data.id;
        const workOrderStatus = await getWorkOrderStatus(workOrderId, accessToken);
        console.log('Current status of the work order:', workOrderStatus);
        const serviceAppointment = await createServiceAppointment(workOrderId, accessToken);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await updateServiceAppointment(serviceAppointment.id, accessToken);
        console.log('Service appointment ID:', serviceAppointment.id);
        return response.data;
    } catch (error) {
        console.error('Error creating work order:', error.message);
        throw new Error(`Failed to create work order: ${error.message}`);
    }
}

module.exports = { workOrderReadyFlow };
