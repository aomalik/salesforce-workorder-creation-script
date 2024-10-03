const axios = require('axios');
const readline = require('readline');

async function serviceAppointmentReadyFlow(accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;

        // Query to find a service appointment with status 'On Hold'
        const query = `SELECT Id, ParentRecordId FROM ServiceAppointment WHERE Status = 'On Hold' LIMIT 1`;
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
            console.log('No service appointment with status "On Hold" found.');
            console.log('Run step 1 to create a new work order and service appointment with status "On Hold"');
            return;
        }

        const serviceAppointmentId = response.data.records[0].Id;
        const workOrderId = response.data.records[0].ParentRecordId;
        console.log('Found service appointment with ID:', serviceAppointmentId);

        // Ask for XOi Job ID input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter XOi Job ID(or random string if not available): ', async (xoiJobId) => {
            try {
                // Update the service appointment with XOi Job ID
                const updateData = {
                    "TC_XOi_Job_ID__c": xoiJobId
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

                console.log('Work Order updated with XOi Job ID', updateResponse.data,"Work Order ID:", workOrderId);

                // Update the service appointment status to "Dispatched"
                const statusUpdateData = {
                    "Status": "Dispatched"
                };

                const statusUpdateResponse = await axios.patch(
                    `${instanceUrl}/services/data/v61.0/sobjects/ServiceAppointment/${serviceAppointmentId}`,
                    statusUpdateData,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Service appointment status updated to "Dispatched":', statusUpdateResponse.data);
                console.log("Service Appointment Ready Platform event triggered");
            } catch (error) {
                console.error('Error updating service appointment:', error.message);
                throw new Error(`Failed to update service appointment: ${error.message}`);
            } finally {
                rl.close();
            }
        });

        // Wait for the readline interface to close before proceeding
        await new Promise(resolve => rl.on('close', resolve));

    } catch (error) {
        console.error('Error finding service appointment:', error.message);
        throw new Error(`Failed to find service appointment: ${error.message}`);
    }
}

module.exports = { serviceAppointmentReadyFlow };