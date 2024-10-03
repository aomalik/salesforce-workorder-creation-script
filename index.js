require('dotenv').config();  // Load environment variables
const readline = require('readline');
const { getSalesforceAuthToken } = require('./utils/auth');
const { workOrderReadyFlow } = require('./events/workOrderReady');
const { serviceAppointmentReadyFlow } = require('./events/serviceAppointmentReady');
const { workOrderDoneFlow } = require('./events/workOrderDone');

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