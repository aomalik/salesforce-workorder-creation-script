const axios = require('axios');
const { getRandomSalesforceId, getWorkOrderStatus, createServiceAppointment, updateServiceAppointment } = require('../utils/salesforceUtils');

async function workOrderReadyFlow(accessToken) {
    try {
        console.log("Starting Work Order Ready Flow...");

        console.log("Fetching random Salesforce IDs for Account, Contact, and WorkType...");
        const accountId = await getRandomSalesforceId('Account', accessToken);
        const contactId = await getRandomSalesforceId('Contact', accessToken);
        const workTypeId = await getRandomSalesforceId('WorkType', accessToken);
        console.log("Fetched IDs - AccountId:", accountId, ", ContactId:", contactId, ", WorkTypeId:", workTypeId);
        
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

        console.log("Creating a new Work Order with the provided data...");
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
        console.log('Work Order created successfully:', response.data);

        const workOrderId = response.data.id;
        console.log("Fetching the current status of the Work Order with ID:", workOrderId);
        const workOrderStatus = await getWorkOrderStatus(workOrderId, accessToken);
        console.log('Current status of the Work Order:', workOrderStatus);

        console.log("Creating a Service Appointment for the Work Order...");
        const serviceAppointment = await createServiceAppointment(workOrderId, accessToken);
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Updating the Service Appointment with ID:", serviceAppointment.id);
        await updateServiceAppointment(serviceAppointment.id, accessToken);
        console.log('Service Appointment updated successfully. ID:', serviceAppointment.id);

        console.log("Work Order Ready Flow completed successfully.");
        return response.data;
    } catch (error) {
        console.error('Error occurred during Work Order Ready Flow:', error.message);
        throw new Error(`Failed to create work order: ${error.message}`);
    }
}

module.exports = { workOrderReadyFlow };
