// Type definitions for Contracts and Invoices

export interface Contract {
  id: string;
  contractNumber: string;
  contractDate: string;
  clientNo?: number;
  clientName: string;
  email: string;
  phone: string;
  clientType: "private" | "business";
  companyName?: string;
  program: string;
  courseLang: string;
  startDate: string;
  validUntil: string;
  courseEndDate: string;
  totalHours: number;
  totalAmount: number;
  discount: number;
  paymentSchedule: string;
  lessonPackages: string;
  status: "pending" | "active" | "completed" | "";
  createdAt: string;
  pdfLink: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  clientName: string;
  clientEmail: string;
  language: "EN" | "DE";
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  items: Array<{ description: string; quantity: number; rate: number }>;
  pdfLink: string;
}
