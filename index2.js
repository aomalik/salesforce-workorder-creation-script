require('dotenv').config();  // Load environment variables

const axios = require('axios');
const { getSalesforceAuthToken } = require('./utils/auth');

// Helper function to get a random Salesforce ID
async function getRandomSalesforceId(objectType, accessToken) {
    console.log("Getting random Salesforce ID for object type:", objectType);
    const instanceUrl = process.env.INSTANCE_URL;
    const response = await axios.get(
        `${instanceUrl}/services/data/v57.0/query?q=SELECT+Id+FROM+${objectType}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.records[0].Id;
}

// Get the work order status by its ID
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

// Create a service appointment linked to the work order
async function createServiceAppointment(workOrderId, accessToken, technicianId) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;
        const serviceAppointmentData = {
            "Subject": "Routine HVAC Maintenance",
            "ParentRecordId": workOrderId,
            "Status": "New",  // You can update this to 'Scheduled' if needed
            "Duration": 120,
            "DurationType": "Minutes",
            "Latitude": 40.712776,
            "Longitude": -74.005974,
            "FSSK__FSK_Assigned_Service_Resource__c": technicianId // Technician assigned
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

// Create a Salesforce Work Order with fields filled from related objects
async function createSalesforceWorkOrder(accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;

        // Fetch related IDs
        const accountId = await getRandomSalesforceId('Account', accessToken);
        const contactId = await getRandomSalesforceId('Contact', accessToken);
        const workTypeId = await getRandomSalesforceId('WorkType', accessToken);
        const technicianId = await getRandomSalesforceId('ServiceResource', accessToken); // Example technician ID fetch
        console.log("Fetched IDs: accountId, contactId, workTypeId, technicianId", accountId, contactId, workTypeId, technicianId);

        // WorkOrder Data (filled with reference fields instead of static values)
        const workOrderData = {
            "Subject": "Routine Maintenance",
            "Description": "Perform routine maintenance on HVAC system",
            "Status": "New",  // Ensure work order is in 'New' status, change to 'In Progress' later if needed
            "Priority": "High",
            "AccountId": accountId,  // This will link to the customer's account
            "ContactId": contactId,  // The contact associated with the work order
            "WorkTypeId": workTypeId,  // The type of work being performed
            "Job_Location_Street__c": "123 Main St",  // You could replace this with Account Billing/Shipping Address
            "Job_Location_PostalCode__c": "12345",
            "Job_Location_City__c": "New York",
            "Job_Location_State__c": "NY",
            "Job_Location_Country__c": "USA"
        };

        // Create Work Order
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

        // Ensure work order status is "New" or "In Progress"
        const workOrderStatus = await getWorkOrderStatus(workOrderId, accessToken);
        if (workOrderStatus !== 'New' && workOrderStatus !== 'In Progress') {
            throw new Error(`Work order is in status ${workOrderStatus}. It must be "New" or "In Progress"`);
        }

        // Create a service appointment for the work order
        const serviceAppointment = await createServiceAppointment(workOrderId, accessToken, technicianId);
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
