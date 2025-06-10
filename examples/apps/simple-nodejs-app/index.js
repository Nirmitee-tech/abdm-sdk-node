import { ABDMClient } from '@nirmitee/abdm-sdk-node';
import readline from 'readline';

const gatewayUrl = 'https://dev.abdm.gov.in/gateway';
const baseUrl = 'https://abhasbx.abdm.gov.in/abha';
const xcmId = 'sbx';







// Prompt for sensitive information
function promptFor(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Prompt the user for the Aadhaar number at runtime
function promptAadhaarNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    const stdin = process.stdin;
    process.stdout.write('Enter Aadhaar number (input will be hidden): ');
    stdin.setRawMode(true);
    let aadhaar = '';
    stdin.on('data', (char) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdout.write('\n');
          stdin.setRawMode(false);
          rl.close();
          resolve(aadhaar.trim());
          break;
        case '\u0003': // Ctrl+C
          process.stdout.write('\n');
          stdin.setRawMode(false);
          rl.close();
          process.exit();
          break;
        case '\u007F': // Backspace
          if (aadhaar.length > 0) {
            aadhaar = aadhaar.slice(0, -1);
          }
          break;
        default:
          aadhaar += char;
          break;
      }
    });
  });
}

function promptOTP() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    rl.question('Enter OTP received on your mobile: ', (otp) => {
      rl.close();
      resolve(otp.trim());
    });
  });
}

async function main() {
  try {
    const clientId = await promptFor('Enter your Client ID: ');
    const clientSecret = await promptFor('Enter your Client Secret: ');

    // Validate required configuration
    if (!clientId || !clientSecret) {
      console.error('\nError: Client ID and Client Secret are required.');
      process.exit(1);
    }

    console.log('Initializing ABDM client...');
    // Initialize the ABDM client with provided credentials
    const client = new ABDMClient({
      clientId,
      clientSecret,
      xcmId,
      basePath: gatewayUrl,
      baseUrl,
      useSandbox: true,
      debug: true,
      timeout: 30000,
    });

    const AADHAAR_NUMBER = await promptAadhaarNumber();
    if (!/^[0-9]{12}$/.test(AADHAAR_NUMBER)) {
      console.error('Invalid Aadhaar number. Must be 12 digits.');
      process.exit(1);
    }
    console.log('\n=== Starting Aadhaar OTP Request ===');
    
    // Send OTP to Aadhaar
    console.log(`\nSending OTP to Aadhaar number: ${AADHAAR_NUMBER}`);
    
    const keyResponse = await client.m1.getPublicKey();
    if (!keyResponse || !keyResponse.data || !keyResponse.data.key) {
      throw new Error('Failed to get public key');
    }
    client.m1.httpClient.publicKey = keyResponse.data.key;

    const encryptedAadhaar = client.m1.httpClient.encrypt(AADHAAR_NUMBER);

    const response = await client.m1.sendAadhaarOTP({
      loginId: encryptedAadhaar,
      loginHint: 'aadhaar',
      scope: ['abha-enrol'],
      otpSystem: 'aadhaar',
      txnId: `TXN${Date.now()}`
    });

    if (!response || !response.data || !response.data.txnId) {
      throw new Error('Failed to get transaction ID from OTP response');
    }
    const txnId = response.data.txnId;

    console.log('\n=== OTP Sent Successfully ===');
    console.log('Transaction ID:', txnId);

    // Prompt for OTP
    const otp = await promptOTP();

    // Verify OTP and create ABHA
    console.log('\n=== Verifying OTP and Creating ABHA ===');
    const abhaResponse = await client.m1.verifyAadhaarOTPAndCreateABHA(otp, txnId);
    if (abhaResponse && abhaResponse.data) {
      console.log('\n=== ABHA Created Successfully ===');
      console.log('ABHA Number:', abhaResponse.data.abhaNumber || abhaResponse.data.abhaId);
      console.log('ABHA Address:', abhaResponse.data.abhaAddress);
      console.log('Transaction ID:', abhaResponse.data.txnId);
    } else {
      console.log('Failed to create ABHA. Response:', abhaResponse);
    }
  } catch (error) {
    const border = '==================================';
    console.error(`\n\n${border}`);
    console.error('=== AN ERROR OCCURRED ===');
    console.error(`${border}\n`);

    // Check for Axios-specific error structure
    if (error.response) {
      console.error(`Status Code: ${error.response.status} ${error.response.statusText}`);

      // ABDM often returns a structured error object
      if (error.response.data && error.response.data.error) {
        const { code, message, details } = error.response.data.error;
        console.error(`\n--- ABDM Error Details ---`);
        console.error(`Code:    ${code}`);
        console.error(`Message: ${message}`);
        if (details) {
          console.error(`Details: ${JSON.stringify(details, null, 2)}`);
        }
        console.error(`--------------------------\n`);

        if (code === 'HIS-401' || error.response.status === 401 || (message && message.includes('Invalid client credentials'))) {
            console.error('Troubleshooting Tips for Authentication Failure:');
            console.error('1. Double-check your Client ID and Client Secret for typos.');
            console.error('2. Ensure your IP address is whitelisted in the ABDM Sandbox.');
            console.error('3. Verify that your credentials are for the correct environment (Sandbox vs. Production).');
        }

      } else {
        // If the error format is unexpected, print the raw data
        console.error('\n--- Raw Response Data ---');
        console.error(JSON.stringify(error.response.data, null, 2));
        console.error(`-------------------------\n`);
      }
    } else if (error.request) {
      // The request was made but no response was received (e.g., network error)
      console.error('Network Error: No response received from the server.');
      console.error('Please check your internet connection and the ABDM server status.');
    } else {
      // Something else happened in setting up the request
      console.error('An unexpected error occurred:');
      console.error(error.message);
    }

    console.error('\nExiting application.');
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);