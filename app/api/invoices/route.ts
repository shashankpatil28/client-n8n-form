import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper: Determine invoice status based on due date and current status
function determineInvoiceStatus(status: string, dueDate: string): 'paid' | 'unpaid' | 'overdue' {
  const normalizedStatus = (status || 'unpaid').toLowerCase();
  if (normalizedStatus === 'paid') return 'paid';

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (due < today) return 'overdue';
  return 'unpaid';
}

// Helper: Parse items from JSON string
function parseItems(itemsJson: string): Array<{ description: string; quantity: number; rate: number }> {
  try {
    if (!itemsJson) return [];
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        description: item.name || item.description || '',
        quantity: item.quantity || 1,
        rate: item.unitPrice || item.rate || 0,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

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

    // Fetch data from the Invoices sheet
    console.log('Fetching invoices from Google Sheets...');
    const range = process.env.INVOICES_SHEET_RANGE || 'Invoices!A2:Z';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} invoice rows`);

    // Transform rows to invoice objects
    // Column mapping based on actual Master_CRM structure:
    // A: Invoice Number
    // B: Contract ID
    // C: Client Name
    // D: Client Email
    // E: Amount
    // F: Currency
    // G: Language
    // H: Issue Date
    // I: Due Date
    // J: Status
    // K: Drive PDF Link
    // L: Items (text)
    // M: Items JSON
    // N: Discount
    // O: Installments (text)
    // P: Installments JSON
    // Q: Extra Notes
    // R: Created At
    const invoices = rows.map((row, index) => {
      const [
        invoiceNumber,    // A: Invoice Number
        contractId,       // B: Contract ID
        clientName,       // C: Client Name
        clientEmail,      // D: Client Email
        amount,           // E: Amount
        currency,         // F: Currency
        language,         // G: Language
        issueDate,        // H: Issue Date
        dueDate,          // I: Due Date
        status,           // J: Status
        pdfLink,          // K: Drive PDF Link
        itemsText,        // L: Items (text)
        itemsJson,        // M: Items JSON
        discount,         // N: Discount
        installmentsText, // O: Installments (text)
        installmentsJson, // P: Installments JSON
        extraNotes,       // Q: Extra Notes
        createdAt,        // R: Created At
      ] = row;

      return {
        id: invoiceNumber || `invoice-${index}`,
        invoiceNumber: invoiceNumber || '',
        contractId: contractId || '',
        clientName: clientName || '',
        clientEmail: clientEmail || '',
        amount: amount ? parseFloat(amount) : 0,
        currency: currency || 'CHF',
        language: (language === 'English' || language === 'EN' ? 'EN' : 'DE') as 'EN' | 'DE',
        issueDate: issueDate || '',
        dueDate: dueDate || '',
        status: determineInvoiceStatus(status, dueDate),
        pdfLink: pdfLink || '',
        items: parseItems(itemsJson || '[]'),
        discount: discount ? parseFloat(discount) : 0,
        extraNotes: extraNotes || '',
        createdAt: createdAt || issueDate || new Date().toISOString(),
      };
    });

    console.log(`Returning ${invoices.length} invoices`);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to fetch invoices',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
