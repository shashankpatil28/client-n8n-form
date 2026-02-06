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

    console.log('Setting up Google Sheets authentication for clients...');

    // Set up Google Sheets authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data from the Client_Info sheet
    console.log('Fetching clients from Google Sheets...');
    const range = process.env.CLIENTS_SHEET_RANGE || 'Client_Info!A2:L';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} client rows`);

    // Transform rows to client objects
    // Column mapping based on Client_Info structure:
    // A: Client No
    // B: Contract ID
    // C: First Name
    // D: Last Name
    // E: Email
    // F: Phone
    // G: Address
    // H: Source
    // I: Language
    // J: Date
    // K: Company Name
    // L: Company Address
    const clients = rows.map((row, index) => {
      const [
        clientNo,           // A: Client No
        contractId,         // B: Contract ID
        firstName,          // C: First Name
        lastName,           // D: Last Name
        email,              // E: Email
        phone,              // F: Phone
        address,            // G: Address
        source,             // H: Source
        language,           // I: Language
        date,               // J: Date
        companyName,        // K: Company Name
        companyAddress,     // L: Company Address
      ] = row;

      // Parse address field (format: "street building, apt\nzip city\nstate, country")
      const addressParts = (address || '').split('\n');
      const streetLine = addressParts[0] || '';
      const zipCityLine = addressParts[1] || '';
      const stateCountryLine = addressParts[2] || '';

      // Parse street line (format: "street building, apt")
      const streetParts = streetLine.split(',');
      const streetAndBuilding = streetParts[0]?.trim() || '';
      const apartment = streetParts[1]?.trim() || '';

      // Further split street and building
      const streetTokens = streetAndBuilding.split(/\s+/);
      const building = streetTokens[streetTokens.length - 1] || '';
      const street = streetTokens.slice(0, -1).join(' ') || streetAndBuilding;

      // Parse zip and city
      const zipCityParts = zipCityLine.trim().split(/\s+/);
      const zip = zipCityParts[0] || '';
      const city = zipCityParts.slice(1).join(' ') || '';

      // Parse state and country
      const stateCountryParts = stateCountryLine.split(',');
      const state = stateCountryParts[0]?.trim() || '';
      const country = stateCountryParts[1]?.trim() || '';

      return {
        id: clientNo || `client-${index}`,
        clientNo: clientNo || '',
        contractId: contractId || '',
        firstName: (firstName || '').trim().replace(/^"|"$/g, ''), // Remove quotes
        lastName: (lastName || '').trim().replace(/^"|"$/g, ''), // Remove quotes
        fullName: `${(firstName || '').trim().replace(/^"|"$/g, '')} ${(lastName || '').trim().replace(/^"|"$/g, '')}`.trim(),
        email: email || '',
        phone: phone || '',
        address: address || '', // Keep full address for reference
        street: street,
        building: building,
        apartment: apartment,
        zip: zip,
        city: city,
        state: state,
        country: country,
        source: source || '',
        language: language || 'English',
        date: date || '',
        companyName: companyName || '',
        companyAddress: companyAddress || '',
        createdAt: date || new Date().toISOString(),
      };
    });

    console.log(`Returning ${clients.length} clients`);
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to fetch clients',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
