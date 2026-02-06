import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define types for invoice data
export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface Installment {
  date: string;
  amount: number;
}

export interface InvoiceData {
  language: 'EN' | 'DE';
  invoiceNumber: string;
  contractNumber?: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail?: string;
  clientAddress: string;
  clientCity: string;
  clientZip: string;
  clientCountry: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  extraNote?: string;
  installments?: Installment[];
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    width: '30%',
  },
  value: {
    color: '#1f2937',
    width: '70%',
  },
  clientBox: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  clientLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  clientText: {
    fontSize: 10,
    color: '#1f2937',
    lineHeight: 1.4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '45%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '25%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#374151',
  },
  totalValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    marginTop: 5,
    borderRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeft: '3 solid #f59e0b',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  installmentsSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderLeft: '3 solid #2563eb',
  },
  installmentsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    fontSize: 9,
  },
});

// Text translations
const translations = {
  EN: {
    invoice: 'INVOICE',
    billTo: 'Bill To',
    invoiceNumber: 'Invoice Number',
    contractNumber: 'Contract Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    description: 'Description',
    quantity: 'Qty',
    unit: 'Unit',
    amount: 'Amount',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'TOTAL',
    notes: 'Notes',
    paymentTerms: 'Payment Terms',
    installments: 'Payment Schedule',
    companyName: 'Language School Zurich',
    companyAddress: 'Zurich, Switzerland',
    companyEmail: 'info@languageschool.ch',
    companyPhone: '+41 XX XXX XX XX',
    footerText: 'Thank you for your business!',
  },
  DE: {
    invoice: 'RECHNUNG',
    billTo: 'Rechnungsempfänger',
    invoiceNumber: 'Rechnungsnummer',
    contractNumber: 'Vertragsnummer',
    invoiceDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    description: 'Beschreibung',
    quantity: 'Menge',
    unit: 'Einheit',
    amount: 'Betrag',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    total: 'GESAMT',
    notes: 'Notizen',
    paymentTerms: 'Zahlungsbedingungen',
    installments: 'Zahlungsplan',
    companyName: 'Sprachschule Zürich',
    companyAddress: 'Zürich, Schweiz',
    companyEmail: 'info@sprachschule.ch',
    companyPhone: '+41 XX XXX XX XX',
    footerText: 'Vielen Dank für Ihr Vertrauen!',
  },
};

// Invoice Document Component
export const InvoiceDocument: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const t = translations[data.language];
  const discountAmount = (data.subtotal * data.discount) / 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{t.companyName}</Text>
          <Text style={styles.companyDetails}>
            {t.companyAddress} • {t.companyEmail} • {t.companyPhone}
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>{t.invoice}</Text>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t.invoiceNumber}:</Text>
            <Text style={styles.value}>{data.invoiceNumber}</Text>
          </View>
          {data.contractNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>{t.contractNumber}:</Text>
              <Text style={styles.value}>{data.contractNumber}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{t.invoiceDate}:</Text>
            <Text style={styles.value}>{data.issueDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.dueDate}:</Text>
            <Text style={styles.value}>{data.dueDate}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>{t.billTo}</Text>
          <Text style={styles.clientText}>{data.clientName}</Text>
          {data.clientEmail && (
            <Text style={styles.clientText}>{data.clientEmail}</Text>
          )}
          <Text style={styles.clientText}>
            {data.clientAddress}
          </Text>
          <Text style={styles.clientText}>
            {data.clientZip} {data.clientCity}
          </Text>
          <Text style={styles.clientText}>{data.clientCountry}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>{t.description}</Text>
            <Text style={styles.col2}>{t.quantity}</Text>
            <Text style={styles.col3}>{t.unit}</Text>
            <Text style={styles.col4}>{t.amount}</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unit}</Text>
              <Text style={styles.col4}>
                {(item.quantity * item.unitPrice).toFixed(2)} CHF
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.subtotal}:</Text>
            <Text style={styles.totalValue}>{data.subtotal.toFixed(2)} CHF</Text>
          </View>
          {data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {t.discount} ({data.discount}%):
              </Text>
              <Text style={styles.totalValue}>-{discountAmount.toFixed(2)} CHF</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{t.total}:</Text>
            <Text style={styles.grandTotalValue}>{data.total.toFixed(2)} CHF</Text>
          </View>
        </View>

        {/* Installments */}
        {data.installments && data.installments.length > 0 && (
          <View style={styles.installmentsSection}>
            <Text style={styles.installmentsLabel}>{t.installments}</Text>
            {data.installments.map((inst, index) => (
              <View key={index} style={styles.installmentRow}>
                <Text>
                  {data.language === 'EN' ? 'Payment' : 'Rate'} {index + 1}: {inst.date}
                </Text>
                <Text>{inst.amount.toFixed(2)} CHF</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {data.extraNote && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>{t.notes}</Text>
            <Text style={styles.notesText}>{data.extraNote}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{t.footerText}</Text>
        </View>
      </Page>
    </Document>
  );
};
