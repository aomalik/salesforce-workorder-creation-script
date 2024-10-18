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

module.exports = {
    createXoiJob
};



