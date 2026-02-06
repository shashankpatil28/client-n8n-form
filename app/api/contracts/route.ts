import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Validate environment variables
    const {
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEETS_SPREADSHEET_ID
    } = process.env;

    if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.error('Missing GOOGLE_SHEETS_SPREADSHEET_ID');
      return NextResponse.json(
        { error: 'Server configuration error: Missing spreadsheet ID' },
        { status: 500 }
      );
    }

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service account email' },
        { status: 500 }
      );
    }

    if (!GOOGLE_PRIVATE_KEY) {
      console.error('Missing GOOGLE_PRIVATE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing private key' },
        { status: 500 }
      );
    }

    console.log('Setting up Google Sheets authentication...');

    // Set up Google Sheets authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data from both Contract_Details and Client_Info sheets
    console.log('Fetching contracts and clients from Google Sheets...');
    const contractsRange = process.env.CONTRACTS_SHEET_RANGE || 'Contract_Details!A2:Z';
    const clientsRange = process.env.CLIENTS_SHEET_RANGE || 'Client_Info!A2:L';

    const [contractsResponse, clientsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
        range: contractsRange,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
        range: clientsRange,
      }),
    ]);

    const rows = contractsResponse.data.values || [];
    const clientRows = clientsResponse.data.values || [];
    console.log(`Found ${rows.length} contract rows and ${clientRows.length} client rows`);

    // Build client lookup map (clientNo -> client data)
    const clientMap = new Map();
    clientRows.forEach((clientRow) => {
      const clientNo = clientRow[0]; // Column A: Client No
      const firstName = (clientRow[2] || '').trim().replace(/^"|"$/g, ''); // Column C: First Name
      const lastName = (clientRow[3] || '').trim().replace(/^"|"$/g, ''); // Column D: Last Name
      const fullName = `${firstName} ${lastName}`.trim();

      if (clientNo) {
        clientMap.set(clientNo, { firstName, lastName, fullName });
      }
    });

    // Transform rows to contract objects
    // Column mapping based on actual Master_CRM structure:
    // A: Contract No
    // B: Client No
    // C: Contract Date
    // D: Program
    // E: Start Date
    // F: Valid Until
    // G: Course End Date
    // H: Total Hours
    // I: Total Value
    // J: Full Payment Schedule
    // K: Discounts
    // L: Lesson Packages
    const contracts = rows.map((row, index) => {
      const [
        contractNo,         // A: Contract No
        clientNo,          // B: Client No
        contractDate,      // C: Contract Date
        program,           // D: Program
        startDate,         // E: Start Date
        validUntil,        // F: Valid Until
        courseEndDate,     // G: Course End Date
        totalHours,        // H: Total Hours
        totalValue,        // I: Total Value
        paymentSchedule,   // J: Full Payment Schedule
        discount,          // K: Discounts
        lessonPackages,    // L: Lesson Packages
      ] = row;

      // Get client name from the client map
      const client = clientMap.get(clientNo);
      const clientName = client?.fullName || '';

      return {
        id: contractNo || `contract-${index}`,
        contractNumber: contractNo || '',
        contractDate: contractDate || '',
        clientNo: clientNo || '',
        clientName: clientName,
        program: program || 'Private tuition',
        startDate: startDate || '',
        validUntil: validUntil || '',
        courseEndDate: courseEndDate || '',
        totalHours: totalHours ? parseFloat(totalHours) : 0,
        totalAmount: totalValue ? parseFloat(totalValue) : 0,
        discount: discount ? parseFloat(discount) : 0,
        paymentSchedule: paymentSchedule || '',
        lessonPackages: lessonPackages || '',
        status: 'active', // Default status since not in sheet
        createdAt: contractDate || new Date().toISOString(),
      };
    });

    console.log(`Returning ${contracts.length} contracts`);
    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to fetch contracts',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
