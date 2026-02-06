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
export async function GET() {
  try {
    // Sample invoice data for testing
    const sampleData = {
      language: 'EN' as const,
      invoiceNumber: '2024/IN/001',
      contractNumber: 'CNT-2024-001',
      issueDate: '2024-02-06',
      dueDate: '2024-02-13',
      clientName: 'John Doe',
      clientEmail: 'john.doe@example.com',
      clientAddress: 'Main Street 123, Apt 4B',
      clientCity: 'Zurich',
      clientZip: '8001',
      clientCountry: 'Switzerland',
      items: [
        {
          description: 'German Language Course - A1 Level',
          quantity: 20,
          unit: 'hrs',
          unitPrice: 75,
        },
        {
          description: 'Course Materials and Books',
          quantity: 1,
          unit: 'qty',
          unitPrice: 150,
        },
      ],
      subtotal: 1650,
      discount: 10,
      total: 1485,
      extraNote: 'Please transfer the payment to our bank account within 7 days.',
      installments: [
        { date: '2024-02-13', amount: 742.5 },
        { date: '2024-03-13', amount: 742.5 },
      ],
    };

    console.log('Generating sample invoice PDF...');
    const pdfBuffer = await generateInvoicePDF(sampleData);

    // Convert Buffer → Uint8Array (compatible with NextResponse)
    const pdfBytes = new Uint8Array(pdfBuffer);
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sample-invoice.pdf"',
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
