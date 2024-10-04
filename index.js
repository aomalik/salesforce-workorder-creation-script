require('dotenv').config();  // Load environment variables
const readline = require('readline');
const { getSalesforceAuthToken } = require('./utils/auth');
const { workOrderReadyFlow } = require('./events/workOrderReady');
const { serviceAppointmentReadyFlow } = require('./events/serviceAppointmentReady');
const { workOrderDoneFlow } = require('./events/workOrderDone');
const { getXoiAuthToken } = require('./utils/xoiAuth');
const { createXoiJob } = require('./utils/xoiUtils');

// Main function
async function main() {
    try {
        const accessToken = await getSalesforceAuthToken();
        if (accessToken) {
            // Menu for selecting flow
            console.log("Access token received", accessToken);
            console.log('Select flow:');
            console.log('1. Work Order Ready Platform Event: This will create a Work Order, a Service Appointment, and 2 Work Order Line Items.');
            console.log('2. Service Appointment Ready Platform Event: This will update the Service Appointment status to "Dispatched".');
            console.log('3. Execute Work Order Done Platform Event: This will update the Work Order status to "Done" (Doesnt work yet.');
            console.log('4. Create two XOi Jobs. Remember to update workordernumber in index.js (Use work order number from step 1)');
            
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('Enter your choice: ', async (choice) => {
                switch (choice.trim()) {
                    case '1':
                        console.log('Executing Work Order Ready Flow...');
                        await workOrderReadyFlow(accessToken);
                        break;
                    case '2':
                        console.log('Executing Service Appointment Ready Flow...');
                        await serviceAppointmentReadyFlow(accessToken);
                        break;
                    case '3':
                        console.log('Executing Work Order Done Flow...');
                        await workOrderDoneFlow(accessToken);
                        break;
                    case '4':
                        console.log('Create a XOI Auth Token');
                        const xoiAuthToken = await getXoiAuthToken();
                        console.log('XOI Auth Token:', xoiAuthToken);

                        // First set of variables
                        const assigneeIds1 = ["adeel.malik@saasfactory.vc"];
                        const customerName1 = "Some Customer";
                        const jobLocation1 = "Some Location";
                        const workOrderNumber1 = "Some Workorder";
                        const label1 = "A human-friendly identifier";
                        const tags1 = ["tag1", "tag2"];
                        const integrationEntityNamespace1 = "AtLeast10Characters";
                        const integrationEntityId1 = "ShouldBeUniqueInYourSystem";
                        const internalNoteText1 = "A note about the job.";

                        // Second set of variables
                        const assigneeIds2 = ["adeel.malik@saasfactory.vc"];
                        const customerName2 = "Another Customer";
                        const jobLocation2 = "Another Location";
                        //const workOrderNumber2 = "Another Workorder";
                        const label2 = "Another human-friendly identifier";
                        const tags2 = ["tag3", "tag4"];
                        const integrationEntityNamespace2 = "AnotherNamespace";
                        const integrationEntityId2 = "AnotherUniqueId";
                        const internalNoteText2 = "Another note about the job.";

                        // Create first XOI job
                        const xoiJob1 = await createXoiJob(xoiAuthToken, assigneeIds1, customerName1, jobLocation1, workOrderNumber1, label1, tags1, integrationEntityNamespace1, integrationEntityId1, internalNoteText1);
                        console.log('First XOI Job Result:', xoiJob1);

                        // Create second XOI job
                        const xoiJob2 = await createXoiJob(xoiAuthToken, assigneeIds2, customerName2, jobLocation2, workOrderNumber1, label2, tags2, integrationEntityNamespace2, integrationEntityId2, internalNoteText2);
                        console.log('Second XOI Job Result:', xoiJob2);

                        break;
                    default:
                        console.log('Invalid choice. Exiting...');
                }
                rl.close();
            });
        }
    } catch (error) {
        console.error('Error getting access token', error);
    }
}

main();