# Salesforce Workorder and Service Appointment Generator 

This project is a simple example of how to use Salesforce API to create a work order and a service appointment.
This script uses createSalesforceWorkOrder to:
      - Fetch random IDs for Account, Contact, and WorkType from a Salesforce Instance.
      - Create a new Work Order with the fetched IDs and additional details.
      - Retrieve and log the status of the created Work Order.
      - Create a Service Appointment linked to the Work Order.

## Prerequisites

- Node.js
- Salesforce API credentials (instance URL, consumer key, and consumer secret)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/aomalik/salesforce-workorder-creation-script.git
   ```

2. Install dependencies:
   ```
   cd salesforce-workorder-creation-script
   npm install
   ```

## Configuration

1. Create a `.env` file in the root of the project and add the env variables from `.env.sample`:

## Usage

1. Run script:
   ```
   node index.js
   ```
