import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePDF, transformN8nToInvoiceData } from '../../lib/pdf-generator';

export const runtime = 'nodejs'; // Use Node.js runtime for PDF generation

export async function POST(request: NextRequest) {
  try {
    console.log('Received invoice PDF generation request');

    // Parse request body
    const body = await request.json();
    console.log('Request payload:', JSON.stringify(body, null, 2));

    // Transform n8n payload to invoice data format
    const invoiceData = transformN8nToInvoiceData(body);
    console.log('Transformed invoice data:', invoiceData);

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Convert Buffer → Uint8Array (compatible with NextResponse)
    const pdfBytes = new Uint8Array(pdfBuffer);
    // Return PDF as buffer
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to generate invoice PDF',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing with sample data
// Use ?lang=english or ?lang=german to test different languages
export async function GET(request: NextRequest) {
  try {
    // Get language from query parameter (default: German)
    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang')?.toLowerCase() || 'german';
    const isEnglish = lang === 'english' || lang === 'en';

    // Sample invoice data for testing
    const sampleData = {
      body: {
        language: isEnglish ? 'English' : 'German',
        debtorName: isEnglish ? 'John Smith' : 'Max Mustermann',
        debtorEmail: isEnglish ? 'john@example.com' : 'max@example.com',
        debtorStreet: isEnglish ? 'Main Street' : 'Bahnhofstrasse',
        debtorHouse: '123',
        debtorApt: isEnglish ? 'Apt 4B' : '',
        debtorCity: isEnglish ? 'Zurich' : 'Zürich',
        debtorZip: '8001',
        debtorCountry: 'Switzerland',
        contractNumber: 'CNT-2024-001',
        invoiceNumber: '2024/IN/001',
        issueDate: '2024-02-15',
        dueDate: '2024-02-29',
        items: [
          {
            name: isEnglish ? 'German Course A1 - Beginner' : 'Deutschkurs A1 - Anfänger',
            quantity: 20,
            unit: isEnglish ? 'hrs' : 'Std',
            unitPrice: 75,
          },
          {
            name: isEnglish ? 'Course Materials and Books' : 'Kursmaterialien und Bücher',
            quantity: 1,
            unit: isEnglish ? 'pcs' : 'Stk',
            unitPrice: 150,
          },
        ],
        discount: 10,
        extraNote: isEnglish
          ? 'Thank you for your trust. If you have any questions, please feel free to contact us.'
          : 'Vielen Dank für Ihr Vertrauen. Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
        installments: [
          {
            date: '2024-02-29',
            amount: 742.5,
          },
          {
            date: '2024-03-29',
            amount: 742.5,
          },
        ],
      },
    };

    console.log(`Generating sample invoice PDF in ${isEnglish ? 'English' : 'German'}...`);
    const invoiceData = transformN8nToInvoiceData(sampleData);
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Convert Buffer → Uint8Array (compatible with NextResponse)
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sample-invoice-${isEnglish ? 'en' : 'de'}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating sample PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate sample PDF',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
