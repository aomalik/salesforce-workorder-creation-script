require('dotenv').config();  // Load environment variables

const axios = require('axios');
const { getSalesforceAuthToken } = require('./utils/auth');

async function getRandomSalesforceId(objectType, accessToken) {
    console.log("Getting random Salesforce ID for object type:", objectType);
    const instanceUrl = process.env.INSTANCE_URL;
    const response = await axios.get(
        `${instanceUrl}/services/data/v57.0/query?q=SELECT+Id,Name+FROM+${objectType}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.records[0].Id;
}

async function getWorkOrderStatus(workOrderId, accessToken) {
    const instanceUrl = process.env.INSTANCE_URL;
    const response = await axios.get(
        `${instanceUrl}/services/data/v61.0/sobjects/WorkOrder/${workOrderId}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.Status;
}

async function createServiceAppointment(workOrderId, accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;
        const serviceAppointmentData = {
            "Subject": "Routine HVAC Maintenance",
            "ParentRecordId": workOrderId,
            "Status": "New",
            "Duration": 120,
            "DurationType": "Minutes",
            "Latitude": 40.712776,
            "Longitude": -74.005974,
            "Status": "New"
        };

        const response = await axios.post(
            `${instanceUrl}/services/data/v61.0/sobjects/ServiceAppointment`,
            serviceAppointmentData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Service appointment created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating service appointment:', error.message);
        throw new Error(`Failed to create service appointment: ${error.message}`);
    }
}

async function updateServiceAppointment(serviceAppointmentId, accessToken) {
    try {
        console.log("Updating service appointment with ID:", serviceAppointmentId);
        const instanceUrl = process.env.INSTANCE_URL;
        const updateData = {
            "FSSK__FSK_Assigned_Service_Resource__c": "0Hn7d0000000nkMCAQ"
        };

        const response = await axios.patch(
            `${instanceUrl}/services/data/v61.0/sobjects/ServiceAppointment/${serviceAppointmentId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Service appointment technician assigned:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating service appointment:', error.message);
        throw new Error(`Failed to update service appointment: ${error.message}`);
    }
}

async function createSalesforceWorkOrder(accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;

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

// Main function
function main() {
    getSalesforceAuthToken().then(accessToken => {
        if (accessToken) {
            console.log('Access token:', accessToken);
            createSalesforceWorkOrder(accessToken);
        }
    }).catch(error => {
        console.error('Error getting access token', error);
    });
}

main();
