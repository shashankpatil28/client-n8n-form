import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const {
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEETS_SPREADSHEET_ID
    } = process.env;

    if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Missing Google Sheets configuration' },
        { status: 500 }
      );
    }

    // Set up Google Sheets authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet metadata to see all sheet names
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    });

    const sheetNames = spreadsheet.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
    })) || [];

    return NextResponse.json({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      spreadsheetTitle: spreadsheet.data.properties?.title,
      sheets: sheetNames,
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    });
  } catch (error: any) {
    console.error('Error getting sheets info:', error);

    return NextResponse.json(
      {
        error: 'Failed to get sheets info',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
