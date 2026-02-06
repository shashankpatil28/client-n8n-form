// TypeScript interfaces for the application data models

export interface Client {
  id: string;
  clientNo: string;
  contractId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string; // Full address as stored in sheet
  street: string;
  building: string;
  apartment: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  source: string;
  language: string;
  date: string;
  companyName: string;
  companyAddress: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  contractDate: string;
  clientNo: string;
  clientName: string;
  program: string;
  startDate: string;
  validUntil: string;
  courseEndDate: string;
  totalHours: number;
  totalAmount: number;
  discount: number;
  paymentSchedule: string;
  lessonPackages: string;
  status: 'pending' | 'active' | 'completed' | '';
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  language: 'EN' | 'DE';
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  pdfLink: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  discount: number;
  extraNotes: string;
  createdAt: string;
}
