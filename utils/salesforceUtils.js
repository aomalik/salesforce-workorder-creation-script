const axios = require('axios');

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

            "Duration": 120,
            "DurationType": "Minutes",
            "Latitude": 40.712776,
            "Longitude": -74.005974,
            "Status": "On Hold"
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

module.exports = {
    getRandomSalesforceId,
    getWorkOrderStatus,
    createServiceAppointment,
    updateServiceAppointment
};
