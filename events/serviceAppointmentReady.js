const axios = require('axios');
const readline = require('readline');
const { getXoiAuthToken } = require('../utils/xoiAuth');
const { queryXoiJobByExternalId, createXoiJobForWorkOrder } = require('../utils/xoiUtils');

async function serviceAppointmentReadyFlow(accessToken) {
    try {
        const instanceUrl = process.env.INSTANCE_URL;

        // Query to find a service appointment with status 'On Hold' and include Work Order XOi Job ID
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

        // Query the Work Order to get complete details including XOi Job ID
        const workOrderQuery = `SELECT Id, TC_XOi_Job_ID__c, WorkOrderNumber, Subject, Description, Street, City, State FROM WorkOrder WHERE Id = '${workOrderId}'`;
        const workOrderResponse = await axios.get(
            `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(workOrderQuery)}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const workOrder = workOrderResponse.data.records[0];
        let xoiJobId = workOrder.TC_XOi_Job_ID__c;

        if (xoiJobId) {
            console.log(`Work Order already has XOi Job ID: ${xoiJobId}`);
            
            // Validate that the XOi job actually exists
            try {
                console.log('Validating XOi Job exists...');
                const xoiAuthToken = await getXoiAuthToken();
                const xoiJobResponse = await queryXoiJobByExternalId(xoiAuthToken, workOrder.Id);
                
                if (xoiJobResponse.data && xoiJobResponse.data.jobs && xoiJobResponse.data.jobs.length > 0) {
                    console.log('✓ XOi Job validated successfully');
                } else {
                    console.log('⚠ XOi Job ID exists on Work Order but no corresponding job found in XOi');
                    console.log('Creating new XOi job...');
                    
                    const newXoiJob = await createXoiJobForWorkOrder(xoiAuthToken, workOrder);
                    if (newXoiJob.data && newXoiJob.data.createJob && newXoiJob.data.createJob.job) {
                        xoiJobId = newXoiJob.data.createJob.job.id;
                        console.log(`✓ New XOi Job created with ID: ${xoiJobId}`);
                        
                        // Update Work Order with the new XOi Job ID
                        const updateData = { "TC_XOi_Job_ID__c": xoiJobId };
                        await axios.patch(
                            `${instanceUrl}/services/data/v61.0/sobjects/WorkOrder/${workOrderId}`,
                            updateData,
                            {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        console.log('Work Order updated with new XOi Job ID');
                    } else {
                        throw new Error('Failed to create XOi job');
                    }
                }
            } catch (error) {
                console.error('Error validating XOi job:', error.message);
                console.log('Proceeding with existing XOi Job ID despite validation error');
            }
        } else {
            console.log('Work Order does not have an XOi Job ID set.');
            console.log('Creating XOi job automatically...');
            
            try {
                const xoiAuthToken = await getXoiAuthToken();
                const newXoiJob = await createXoiJobForWorkOrder(xoiAuthToken, workOrder);
                
                if (newXoiJob.data && newXoiJob.data.createJob && newXoiJob.data.createJob.job) {
                    xoiJobId = newXoiJob.data.createJob.job.id;
                    console.log(`✓ XOi Job created successfully with ID: ${xoiJobId}`);
                    
                    // Update the work order with XOi Job ID
                    const updateData = { "TC_XOi_Job_ID__c": xoiJobId };
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
                    console.log('Work Order updated with XOi Job ID', updateResponse.data, "Work Order ID:", workOrderId);
                } else {
                    throw new Error('Failed to create XOi job - invalid response structure');
                }
            } catch (error) {
                console.error('Error creating XOi job:', error.message);
                console.log('Falling back to manual input...');
                
                // Fallback to manual input
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                xoiJobId = await new Promise((resolve) => {
                    rl.question('Enter XOi Job ID (or random string if not available): ', (inputXoiJobId) => {
                        rl.close();
                        resolve(inputXoiJobId);
                    });
                });
                
                // Update Work Order with manually entered XOi Job ID
                const updateData = { "TC_XOi_Job_ID__c": xoiJobId };
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
                console.log('Work Order updated with manually entered XOi Job ID', updateResponse.data);
            }
        }

        try {
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
            console.log(`✓ Service Appointment Ready Platform event triggered with XOi Job ID: ${xoiJobId}`);
        } catch (error) {
            console.error('Error updating service appointment:', error.message);
            throw new Error(`Failed to update service appointment: ${error.message}`);
        }

    } catch (error) {
        console.error('Error finding service appointment:', error.message);
        throw new Error(`Failed to find service appointment: ${error.message}`);
    }
}

module.exports = { serviceAppointmentReadyFlow };