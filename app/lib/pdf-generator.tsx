import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, type InvoiceData } from '../templates/invoice-template';

/**
 * Generate invoice PDF from data
 * @param data Invoice data
 * @returns PDF as Buffer
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  try {
    // Render React PDF component to buffer
    const pdfBuffer = await renderToBuffer(<InvoiceDocument data={data} />);

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

  return {
    language: body.language === 'English' || body.language === 'EN' ? 'EN' : 'DE',
    invoiceNumber: body.invoiceNumber || '',
    contractNumber: body.contractNumber || '',
    issueDate: body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: body.dueDate || '',
    clientName: body.debtorName || '',
    clientEmail: body.debtorEmail || '',
    clientAddress: [
      body.debtorStreet || body.debtorAddress,
      body.debtorHouse || body.debtorBuilding,
      body.debtorApt || body.debtorApartment,
    ]
      .filter(Boolean)
      .join(', '),
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
