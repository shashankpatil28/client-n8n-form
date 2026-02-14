import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, type InvoiceData } from '../templates/invoice-template';
import QRCode from 'qrcode';

/**
 * Generate Swiss QR Bill payload string according to Swiss Payment Standards
 * @see https://www.paymentstandards.ch/dam/downloads/ig-qr-bill-en.pdf
 */
function generateSwissQRBillPayload(data: InvoiceData): string {
  // Parse client address to extract street and building number
  const addressParts = data.clientAddress.split(',').map(s => s.trim());
  const streetAddress = addressParts[0] || data.clientAddress;

  // Try to extract building number from address
  const addressMatch = streetAddress.match(/^(.+?)\s+(\d+[a-zA-Z]*)$/);
  const debtorStreet = addressMatch ? addressMatch[1] : streetAddress;
  const debtorBuildingNumber = addressMatch ? addressMatch[2] : '';

  // Format amount with 2 decimal places
  const formattedAmount = data.total.toFixed(2);

  // Build Swiss QR code payload according to specification
  const qrPayload = [
    'SPC',                                          // QRType
    '0200',                                         // Version
    '1',                                            // Coding (1 = UTF-8)
    data.bankIban || 'CH5880808003783970418',      // IBAN
    'S',                                            // Creditor Address Type (S = Structured, K = Combined)
    'DeinDeutschCoach Renata Giannini Ferreira',   // Creditor Name
    'Lüssiweg',                                     // Creditor Street
    '2B',                                           // Creditor Building Number
    '6300',                                         // Creditor Postal Code
    'Zug',                                          // Creditor City
    'CH',                                           // Creditor Country
    '',                                             // Ultimate Creditor Address Type (empty = none)
    '',                                             // Ultimate Creditor Name
    '',                                             // Ultimate Creditor Street
    '',                                             // Ultimate Creditor Building Number
    '',                                             // Ultimate Creditor Postal Code
    '',                                             // Ultimate Creditor City
    '',                                             // Ultimate Creditor Country
    formattedAmount,                                // Amount
    'CHF',                                          // Currency
    'S',                                            // Debtor Address Type (S = Structured)
    data.clientName,                                // Debtor Name
    debtorStreet,                                   // Debtor Street
    debtorBuildingNumber,                           // Debtor Building Number
    data.clientZip,                                 // Debtor Postal Code
    data.clientCity,                                // Debtor City
    data.clientCountry || 'CH',                     // Debtor Country
    'NON',                                          // Reference Type (NON = without reference, QRR = QR reference, SCOR = Creditor Reference)
    '',                                             // Reference (empty for NON type)
    `Invoice ${data.invoiceNumber}${data.contractNumber ? ' - Contract ' + data.contractNumber : ''}`, // Unstructured Message
    'EPD',                                          // Trailer (EPD = End Payment Data)
    '',                                             // Bill Information (optional)
    'eBill/B2B',                                    // Alternative Procedures (optional)
  ].join('\r\n');

  return qrPayload;
}

/**
 * Generate Swiss QR Bill as PNG data URI
 * @param data Invoice data
 * @returns PNG data URI string
 */
export async function generateSwissQRCodeDataURI(data: InvoiceData): Promise<string> {
  try {
    // Generate Swiss QR Bill payload
    const qrPayload = generateSwissQRBillPayload(data);

    // Generate QR code as PNG data URI
    // Swiss QR codes must have:
    // - Error correction level M (15% error correction)
    // - Swiss Cross in the center (we'll add this visually in the template)
    const qrCodeDataUri = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 543,  // 46mm at 300 DPI ≈ 543 pixels (Swiss QR code standard size)
      margin: 0,   // No margin, we'll handle spacing in the template
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUri;
  } catch (error) {
    console.error('Error generating Swiss QR code:', error);
    // Return empty string if QR generation fails - PDF will still work without it
    return '';
  }
}

/**
 * Generate invoice PDF from data
 * @param data Invoice data
 * @returns PDF as Buffer
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  try {
    // Generate Swiss QR code data URI
    const qrCodeDataUri = await generateSwissQRCodeDataURI(data);

    // Add QR code to invoice data
    const invoiceDataWithQR = {
      ...data,
      qrCodeDataUri,
    };

    // Render React PDF component to buffer
    const pdfBuffer = await renderToBuffer(<InvoiceDocument data={invoiceDataWithQR} />);

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert n8n webhook payload to InvoiceData format
 * This handles the transformation from your form data to the template format
 */
export function transformN8nToInvoiceData(n8nPayload: any): InvoiceData {
  const body = n8nPayload.body || n8nPayload;

  // Calculate subtotal from items
  const items = (body.items || []).map((item: any) => ({
    description: item.name || item.description || '',
    quantity: Number(item.quantity) || 0,
    unit: item.unit || 'hrs',
    unitPrice: Number(item.unitPrice) || 0,
  }));

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unitPrice,
    0
  );

  const discount = Number(body.discount) || 0;
  const total = subtotal * (1 - discount / 100);

  // Transform installments if present
  const installments = (body.installments || []).map((inst: any) => ({
    date: inst.date || '',
    amount: Number(inst.amount) || 0,
  }));

  // Build client address
  const clientAddress = [
    body.debtorStreet || body.debtorAddress,
    body.debtorHouse || body.debtorBuilding,
    body.debtorApt || body.debtorApartment,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    language: body.language === 'English' || body.language === 'EN' ? 'EN' : 'DE',
    invoiceNumber: body.invoiceNumber || '',
    contractNumber: body.contractNumber || '',
    issueDate: body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: body.dueDate || '',
    clientName: body.debtorName || '',
    clientEmail: body.debtorEmail || '',
    clientAddress: clientAddress || '',
    clientCity: body.debtorCity || '',
    clientZip: body.debtorZip || '',
    clientCountry: body.debtorCountry || '',
    items,
    subtotal,
    discount,
    total,
    extraNote: body.extraNote || '',
    installments: installments.length > 0 ? installments : undefined,
  };
}
