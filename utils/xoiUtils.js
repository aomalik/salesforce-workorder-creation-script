const axios = require('axios');

async function createXoiJob(authToken, assigneeIds, customerName, jobLocation, workOrderNumber, label, tags, integrationEntityNamespace, integrationEntityId, internalNoteText, externalId) {
    const apiUrl = process.env.XOI_API_JOBS_EXTERNAL_URL;

    const mutation = `
        mutation CreateJob {
          createJob(
            input: {
              newJob: {
                assigneeIds: ${JSON.stringify(assigneeIds)}
                customerName: "${customerName}"
                jobLocation: "${jobLocation}"
                workOrderNumber: "${workOrderNumber}"
                label: "${label}"
                externalId: "${externalId}"
                tags: ${JSON.stringify(tags)}
                integrationEntityId: {
                    namespace: "${integrationEntityNamespace}",
                    id: "${integrationEntityId}"
                }       
                internalNote: {
                  text: "${internalNoteText}"
                }
              },
              additionalActions: {
                createPublicShare: {
                  enabled: false
                }
              }
            }
          ) {
            job {
              id
              createdAt
              createdBy
              assigneeIds
              customerName
              jobLocation
              workOrderNumber
              label
              tags
              integrationEntityId {
                namespace
                id
              }   
              internalNote {
                text
              }
            }
            additionalActionsResults {
              createPublicShare {
                id
                shareLink
              }
            }
          }
        }
    `;

    try {
        const response = await axios.post(apiUrl, {
            query: mutation
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating XOi job:', error.message);
        throw new Error('Failed to create XOi job');
    }
}

async function queryXoiJobByExternalId(authToken, externalId) {
    const apiUrl = process.env.XOI_API_JOBS_EXTERNAL_URL;

    const query = `
        query GetJobByExternalId {
          jobs(filter: { externalId: "${externalId}" }) {
            id
            externalId
            workOrderNumber
            customerName
            jobLocation
            label
            status
            createdAt
          }
        }
    `;

    try {
        const response = await axios.post(apiUrl, {
            query: query
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error querying XOi job:', error.message);
        throw new Error('Failed to query XOi job');
    }
}

async function createXoiJobForWorkOrder(authToken, workOrder) {
    const assigneeIds = ["emmanuel.rivera@trane.com.invalid"]; // Default assignee
    const customerName = "Auto-Generated Customer";
    const jobLocation = `${workOrder.Street || ''} ${workOrder.City || ''} ${workOrder.State || ''}`.trim() || "Default Location";
    const workOrderNumber = workOrder.WorkOrderNumber;
    const externalId = workOrder.Id;
    const label = workOrder.Subject || "Auto-Generated Job";
    const tags = ["auto-generated"];
    const integrationEntityNamespace = "SalesforceWorkOrder";
    const integrationEntityId = workOrder.Id;
    const internalNoteText = workOrder.Description || "Auto-generated from Salesforce Work Order";

    return await createXoiJob(
        authToken, 
        assigneeIds, 
        customerName, 
        jobLocation, 
        workOrderNumber, 
        label, 
        tags, 
        integrationEntityNamespace, 
        integrationEntityId, 
        internalNoteText, 
        externalId
    );
}

module.exports = {
    createXoiJob,
    queryXoiJobByExternalId,
    createXoiJobForWorkOrder
};



