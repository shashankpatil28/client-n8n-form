// TypeScript interfaces for the application data models

export interface Contract {
  id: string;
  contractNumber: string;
  contractDate: string;
  clientNo: string;
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
