import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
  bankName?: string;
  bankSwift?: string;
  bankIban?: string;
  qrCodeDataUri?: string;  // Generated QR code as data URI
}

// Create styles - Professional German Invoice Design
const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingTop: 40,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  // Header section with logo and invoice info
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 12,
    borderBottom: '2 solid #000000',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  companyTagline: {
    fontSize: 7,
    color: '#666666',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Invoice info box (right side of header)
  invoiceBox: {
    textAlign: 'right',
    paddingLeft: 20,
  },
  invoiceBoxLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  invoiceBoxRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  invoiceBoxKey: {
    fontSize: 9,
    color: '#666666',
    marginRight: 8,
    width: 90,
    textAlign: 'right',
  },
  invoiceBoxValue: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  // Billing section (Billed By / Billed To)
  billingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
  },
  billedBySection: {
    width: '48%',
  },
  billedToSection: {
    width: '48%',
  },
  billingLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  billingText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#333333',
    marginBottom: 2,
  },
  billedToBox: {
    borderLeft: '3 solid #000000',
    paddingLeft: 12,
  },
  billedToText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#000000',
    marginBottom: 2,
  },
  // Items table
  table: {
    marginTop: 10,
    marginBottom: 15,
    borderTop: '2 solid #000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderBottom: '1 solid #000000',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #dddddd',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 9,
  },
  tableCol1: { width: '6%' },   // #
  tableCol2: { width: '44%' },  // Description
  tableCol3: { width: '16%', textAlign: 'center' },  // Quantity
  tableCol4: { width: '17%', textAlign: 'right' },   // Unit Price
  tableCol5: { width: '17%', textAlign: 'right' },   // Total
  // Totals section
  totalsSection: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 9,
    color: '#333333',
  },
  totalValue: {
    fontSize: 9,
    color: '#333333',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderTop: '2 solid #000000',
    borderBottom: '2 solid #000000',
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  autoCalculatedText: {
    fontSize: 7,
    color: '#999999',
    textAlign: 'right',
    marginTop: 3,
    fontStyle: 'italic',
  },
  // Contract Details section
  contractDetailsSection: {
    marginTop: 15,
    marginBottom: 12,
    paddingTop: 10,
    borderTop: '1 solid #dddddd',
  },
  contractDetailsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  contractRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  contractLabel: {
    fontSize: 9,
    color: '#666666',
    width: '30%',
  },
  contractValue: {
    fontSize: 9,
    color: '#000000',
    width: '70%',
    fontWeight: 'bold',
  },
  installmentsContainer: {
    marginTop: 8,
  },
  installmentText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#333333',
  },
  // Bank details on first page
  bankDetailsFirstPage: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 10,
    borderTop: '1 solid #dddddd',
  },
  bankDetailsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  bankDetailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bankDetailLabel: {
    fontSize: 9,
    color: '#666666',
    width: '30%',
  },
  bankDetailValue: {
    fontSize: 9,
    color: '#000000',
    width: '70%',
    fontWeight: 'bold',
  },
  // Notes and footer section
  notesSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.6,
    textAlign: 'left',
  },
  extraNoteSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: '1 solid #dddddd',
  },
  extraNoteText: {
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  // Page 2 styles - Swiss QR Bill only
  page2: {
    padding: 0,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  // Swiss QR Bill - positioned at bottom of page
  // Following Swiss Payment Standards (210mm width, ~106mm height)
  paymentSlipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300, // ~106mm in points for Swiss QR bill
    borderTop: '1 dashed #000000', // Scissors/perforation line
  },
  paymentSlipInner: {
    flexDirection: 'row',
    height: '100%',
  },
  // Empfangsschein (Receipt) section - Left (~62mm width = 29.5%)
  receiptSection: {
    width: '29.5%',
    borderRight: '1 solid #000000',
    padding: 5,
    paddingLeft: 5,
    paddingTop: 8,
    position: 'relative',
  },
  receiptTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 2,
  },
  receiptText: {
    fontSize: 8,
    lineHeight: 1.3,
    marginBottom: 1,
  },
  receiptAmountLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  receiptAmountBox: {
    marginTop: 3,
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  acceptancePointContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  acceptancePointLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  // Zahlteil (Payment part) section - Right (~148mm width = 70.5%)
  paymentSection: {
    width: '70.5%',
    padding: 5,
    paddingLeft: 8,
    paddingTop: 8,
    flexDirection: 'row',
  },
  paymentLeft: {
    width: '45%',
    paddingRight: 10,
  },
  paymentRight: {
    width: '55%',
    paddingLeft: 5,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  // QR Code - Swiss standard 46mm x 46mm
  qrCodeContainer: {
    width: 130,  // 46mm at 72 DPI ≈ 130pt
    height: 130,
    marginBottom: 10,
    marginTop: 5,
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  // Swiss Cross overlay - 7mm x 7mm
  swissCross: {
    position: 'absolute',
    width: 20,  // 7mm ≈ 20pt
    height: 20,
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  swissCrossHorizontal: {
    position: 'absolute',
    width: 16,
    height: 5,
    top: 7.5,
    left: 2,
    backgroundColor: '#000000',
  },
  swissCrossVertical: {
    position: 'absolute',
    width: 5,
    height: 16,
    top: 2,
    left: 7.5,
    backgroundColor: '#000000',
  },
  paymentLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 2,
  },
  paymentText: {
    fontSize: 8,
    lineHeight: 1.3,
    marginBottom: 1,
  },
  currencyAmountBox: {
    marginTop: 3,
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Text translations
const translations = {
  EN: {
    companyName: 'DeinDeutschCoach',
    companyTagline: 'PERSONALIZED TRAINING EXPERIENCE',
    companyOwner: 'Renata Giannini Ferreira',
    companyAddress: 'Lüssiweg 2B',
    companyCityZip: '6300 Zug',
    companyCountry: 'Switzerland',
    invoiceLabel: 'Invoice N°',
    invoiceDate: 'Invoice date:',
    dueDate: 'Due date:',
    billedBy: 'Billed by:',
    billedTo: 'Billed to:',
    number: '#',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    totalAmount: 'Total Amount',
    autoCalculated: 'auto calculated',
    contractDetails: 'Contract Details:',
    contractNumber: 'Contract Number:',
    installments: 'Installments:',
    inst: 'Inst.',
    bankDetails: 'Bank and Payment Details:',
    bankName: 'Bank Name:',
    swift: 'SWIFT / BIC:',
    iban: 'IBAN:',
    paymentInstruction1: 'Please state the invoice number and/or customer number when making payment.',
    paymentInstruction2: 'The invoice amount is payable without deduction after receipt of the invoice before the start of the course.',
    // Payment slip labels
    receipt: 'Receipt',
    accountPayableTo: 'Account / Payable to',
    payableBy: 'Payable by',
    currency: 'Currency',
    amount: 'Amount',
    paymentPart: 'Payment part',
    additionalInfo: 'Additional information',
    acceptancePoint: 'Acceptance point',
  },
  DE: {
    companyName: 'DeinDeutschCoach',
    companyTagline: 'PERSONALIZED TRAINING EXPERIENCE',
    companyOwner: 'Renata Giannini Ferreira',
    companyAddress: 'Lüssiweg 2B',
    companyCityZip: '6300 Zug',
    companyCountry: 'Schweiz',
    invoiceLabel: 'Rechnung N°',
    invoiceDate: 'Rechnungsdatum:',
    dueDate: 'Fälligkeitsdatum:',
    billedBy: 'Rechnungssteller:',
    billedTo: 'Rechnungsempfänger:',
    number: '#',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einheitspreis',
    total: 'Gesamt',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    totalAmount: 'Gesamtbetrag',
    autoCalculated: 'automatisch berechnet',
    contractDetails: 'Vertragsdetails:',
    contractNumber: 'Vertragsnummer:',
    installments: 'Raten:',
    inst: 'Rate',
    bankDetails: 'Bank- und Zahlungsdetails:',
    bankName: 'Bankname:',
    swift: 'SWIFT / BIC:',
    iban: 'IBAN:',
    paymentInstruction1: 'Bitte geben Sie bei der Zahlung die Rechnungsnummer und/oder Kundennummer an.',
    paymentInstruction2: 'Der Rechnungsbetrag ist ohne Abzug nach Erhalt der Rechnung vor Kursbeginn fällig.',
    // Payment slip labels
    receipt: 'Empfangsschein',
    accountPayableTo: 'Konto / Zahlbar an',
    payableBy: 'Zahlbar durch',
    currency: 'Währung',
    amount: 'Betrag',
    paymentPart: 'Zahlteil',
    additionalInfo: 'Zusätzliche Informationen',
    acceptancePoint: 'Annahmestelle',
  },
};

// Invoice Document Component
export const InvoiceDocument: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const t = translations[data.language];
  const discountAmount = (data.subtotal * data.discount) / 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Company Name and Invoice Info Box */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{t.companyName}</Text>
            <Text style={styles.companyTagline}>{t.companyTagline}</Text>
          </View>
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceBoxLabel}>{t.invoiceLabel} {data.invoiceNumber}</Text>
            <View style={styles.invoiceBoxRow}>
              <Text style={styles.invoiceBoxKey}>{t.invoiceDate}</Text>
              <Text style={styles.invoiceBoxValue}>{data.issueDate}</Text>
            </View>
            <View style={styles.invoiceBoxRow}>
              <Text style={styles.invoiceBoxKey}>{t.dueDate}</Text>
              <Text style={styles.invoiceBoxValue}>{data.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Billed By and Billed To */}
        <View style={styles.billingContainer}>
          <View style={styles.billedBySection}>
            <Text style={styles.billingLabel}>{t.billedBy}</Text>
            <Text style={styles.billingText}>{t.companyName}</Text>
            <Text style={styles.billingText}>{t.companyOwner}</Text>
            <Text style={styles.billingText}>{t.companyAddress}</Text>
            <Text style={styles.billingText}>{t.companyCityZip}</Text>
            <Text style={styles.billingText}>{t.companyCountry}</Text>
          </View>

          <View style={styles.billedToSection}>
            <Text style={styles.billingLabel}>{t.billedTo}</Text>
            <View style={styles.billedToBox}>
              <Text style={styles.billedToText}>{data.clientName}</Text>
              <Text style={styles.billedToText}>{data.clientAddress}</Text>
              <Text style={styles.billedToText}>{data.clientZip} {data.clientCity}</Text>
              <Text style={styles.billedToText}>{data.clientCountry}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>{t.number}</Text>
            <Text style={styles.tableCol2}>{t.description}</Text>
            <Text style={styles.tableCol3}>{t.quantity}</Text>
            <Text style={styles.tableCol4}>{t.unitPrice}</Text>
            <Text style={styles.tableCol5}>{t.total}</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{index + 1}.</Text>
              <Text style={styles.tableCol2}>{item.description}</Text>
              <Text style={styles.tableCol3}>{item.quantity} {item.unit}</Text>
              <Text style={styles.tableCol4}>CHF {item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.tableCol5}>CHF {(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.subtotal}</Text>
            <Text style={styles.totalValue}>CHF {data.subtotal.toFixed(2)}</Text>
          </View>

          {data.discount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.totalLabel}>{t.discount} ({data.discount}%)</Text>
              <Text style={styles.totalValue}>CHF -{discountAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{t.totalAmount}</Text>
            <Text style={styles.grandTotalValue}>CHF {data.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Contract Details */}
        {data.contractNumber && (
          <View style={styles.contractDetailsSection}>
            <Text style={styles.contractDetailsLabel}>{t.contractDetails}</Text>

            <View style={styles.contractRow}>
              <Text style={styles.contractLabel}>{t.contractNumber}</Text>
              <Text style={styles.contractValue}>{data.contractNumber}</Text>
            </View>

            {data.installments && data.installments.length > 0 && (
              <View style={styles.installmentsContainer}>
                <Text style={[styles.contractLabel, { marginBottom: 6 }]}>{t.installments}</Text>
                {data.installments.map((inst, index) => (
                  <Text key={index} style={styles.installmentText}>
                    {index + 1}. {t.inst} - {inst.date} (CHF {inst.amount.toFixed(2)})
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bank Details on First Page */}
        <View style={styles.bankDetailsFirstPage}>
          <Text style={styles.bankDetailsTitle}>{t.bankDetails}</Text>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankDetailLabel}>{t.bankName}</Text>
            <Text style={styles.bankDetailValue}>{data.bankName || 'Raiffeisen Bank'}</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankDetailLabel}>{t.swift}</Text>
            <Text style={styles.bankDetailValue}>{data.bankSwift || 'RAIFCH22XXX'}</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankDetailLabel}>{t.iban}</Text>
            <Text style={styles.bankDetailValue}>{data.bankIban || 'CH58 8080 8003 7839 7041 8'}</Text>
          </View>
        </View>

        {/* Extra Note */}
        {data.extraNote && (
          <View style={styles.extraNoteSection}>
            <Text style={styles.extraNoteText}>{data.extraNote}</Text>
          </View>
        )}

        {/* Payment Instructions */}
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>{t.paymentInstruction1}</Text>
          <Text style={styles.notesText}>{t.paymentInstruction2}</Text>
        </View>
      </Page>

      {/* Page 2: Swiss QR Payment Slip */}
      <Page size="A4" style={styles.page2}>
        {/* Swiss QR Bill - positioned at bottom with perforation line */}
        <View style={styles.paymentSlipContainer}>
          <View style={styles.paymentSlipInner}>
            {/* Left section: Empfangsschein (Receipt) */}
            <View style={styles.receiptSection}>
              <Text style={styles.receiptTitle}>{t.receipt}</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.receiptLabel}>{t.accountPayableTo}</Text>
                <Text style={styles.receiptText}>{data.bankIban || 'CH58 8080 8003 7839 7041 8'}</Text>
                <Text style={styles.receiptText}>{t.companyName}</Text>
                <Text style={styles.receiptText}>{t.companyOwner}</Text>
                <Text style={styles.receiptText}>{t.companyAddress}</Text>
                <Text style={styles.receiptText}>{t.companyCityZip}</Text>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.receiptLabel}>{t.payableBy}</Text>
                <Text style={styles.receiptText}>{data.clientName}</Text>
                <Text style={styles.receiptText}>{data.clientAddress}</Text>
                <Text style={styles.receiptText}>{data.clientZip} {data.clientCity}</Text>
              </View>

              <View style={styles.receiptAmountBox}>
                <Text style={styles.receiptAmountLabel}>{t.currency}</Text>
                <Text style={styles.receiptAmount}>CHF</Text>
              </View>

              <View style={styles.receiptAmountBox}>
                <Text style={styles.receiptAmountLabel}>{t.amount}</Text>
                <Text style={styles.receiptAmount}>{data.total.toFixed(2)}</Text>
              </View>

              <View style={styles.acceptancePointContainer}>
                <Text style={styles.acceptancePointLabel}>{t.acceptancePoint}</Text>
              </View>
            </View>

            {/* Right section: Zahlteil (Payment part) */}
            <View style={styles.paymentSection}>
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentTitle}>{t.paymentPart}</Text>

                {/* QR Code with Swiss Cross */}
                <View style={styles.qrCodeContainer}>
                  {data.qrCodeDataUri ? (
                    <>
                      <Image
                        src={data.qrCodeDataUri}
                        style={styles.qrImage}
                      />
                      {/* Swiss Cross Overlay */}
                      <View style={styles.swissCross}>
                        <View style={styles.swissCrossHorizontal} />
                        <View style={styles.swissCrossVertical} />
                      </View>
                    </>
                  ) : (
                    <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 50 }}>QR Code</Text>
                  )}
                </View>

                <View style={styles.currencyAmountBox}>
                  <Text style={styles.receiptAmountLabel}>{t.currency}</Text>
                  <Text style={styles.paymentAmount}>CHF</Text>
                </View>

                <View style={styles.currencyAmountBox}>
                  <Text style={styles.receiptAmountLabel}>{t.amount}</Text>
                  <Text style={styles.paymentAmount}>{data.total.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.paymentRight}>
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.paymentLabel}>{t.accountPayableTo}</Text>
                  <Text style={styles.paymentText}>{data.bankIban || 'CH58 8080 8003 7839 7041 8'}</Text>
                  <Text style={styles.paymentText}>{t.companyName}</Text>
                  <Text style={styles.paymentText}>{t.companyOwner}</Text>
                  <Text style={styles.paymentText}>{t.companyAddress}</Text>
                  <Text style={styles.paymentText}>{t.companyCityZip}</Text>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.paymentLabel}>{t.additionalInfo}</Text>
                  <Text style={styles.paymentText}>
                    {t.invoiceLabel} {data.invoiceNumber}
                    {data.contractNumber && ` - ${t.contractNumber} ${data.contractNumber}`}
                  </Text>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.paymentLabel}>{t.payableBy}</Text>
                  <Text style={styles.paymentText}>{data.clientName}</Text>
                  <Text style={styles.paymentText}>{data.clientAddress}</Text>
                  <Text style={styles.paymentText}>{data.clientZip} {data.clientCity}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
