export interface Contract {
  id: string;
  contractNumber: string;
  contractDate: string;
  clientName: string;
  email: string;
  phone: string;
  clientType: "private" | "business";
  companyName?: string;
  program: string;
  courseLang: string;
  totalAmount: number;
  status: "pending" | "active" | "completed";
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

export const mockContracts: Contract[] = [
  {
    id: "CNT-001",
    contractNumber: "2026/CON/001",
    contractDate: "2026-01-23",
    clientName: "Innovation Hub Zürich",
    email: "contact@innovationhub.ch",
    phone: "+41436667788",
    clientType: "business",
    companyName: "Innovation Hub Zürich",
    program: "Corporate training",
    courseLang: "Spanish",
    totalAmount: 9800,
    status: "pending",
    createdAt: "2026-01-23T15:45:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-001",
  },
  {
    id: "CNT-002",
    contractNumber: "2026/CON/002",
    contractDate: "2026-01-22",
    clientName: "Global Solutions AG",
    email: "training@globalsolutions.ch",
    phone: "+41587778899",
    clientType: "business",
    companyName: "Global Solutions AG",
    program: "Corporate training",
    courseLang: "German",
    totalAmount: 15500,
    status: "active",
    createdAt: "2026-01-22T16:00:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-002",
  },
  {
    id: "CNT-003",
    contractNumber: "2026/CON/003",
    contractDate: "2026-01-20",
    clientName: "Marco Rossi",
    email: "marco.rossi@example.com",
    phone: "+41762223344",
    clientType: "private",
    program: "Private tuition",
    courseLang: "Spanish",
    totalAmount: 2800,
    status: "pending",
    createdAt: "2026-01-20T09:15:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-003",
  },
  {
    id: "CNT-004",
    contractNumber: "2026/CON/004",
    contractDate: "2026-01-18",
    clientName: "Tech Innovations GmbH",
    email: "hr@techinnovations.ch",
    phone: "+41443334455",
    clientType: "business",
    companyName: "Tech Innovations GmbH",
    program: "Corporate training",
    courseLang: "English",
    totalAmount: 12000,
    status: "active",
    createdAt: "2026-01-18T14:20:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-004",
  },
  {
    id: "CNT-005",
    contractNumber: "2026/CON/005",
    contractDate: "2026-01-15",
    clientName: "Anna Müller",
    email: "anna.mueller@example.com",
    phone: "+41791234567",
    clientType: "private",
    program: "Private tuition",
    courseLang: "German",
    totalAmount: 3600,
    status: "active",
    createdAt: "2026-01-15T10:30:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-005",
  },
  {
    id: "CNT-006",
    contractNumber: "2026/CON/006",
    contractDate: "2026-01-10",
    clientName: "Lisa Weber",
    email: "lisa.weber@example.com",
    phone: "+41781112233",
    clientType: "private",
    program: "Private tuition",
    courseLang: "English",
    totalAmount: 3200,
    status: "active",
    createdAt: "2026-01-10T13:30:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2026-CON-006",
  },
  {
    id: "CNT-007",
    contractNumber: "2025/CON/010",
    contractDate: "2025-12-10",
    clientName: "Sophie Dubois",
    email: "sophie.dubois@example.com",
    phone: "+41795556677",
    clientType: "private",
    program: "Private tuition",
    courseLang: "French",
    totalAmount: 4200,
    status: "completed",
    createdAt: "2025-12-10T11:45:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2025-CON-010",
  },
  {
    id: "CNT-008",
    contractNumber: "2025/CON/009",
    contractDate: "2025-11-25",
    clientName: "Hans Schmidt",
    email: "hans.schmidt@example.com",
    phone: "+41794445566",
    clientType: "private",
    program: "Private tuition",
    courseLang: "German",
    totalAmount: 2400,
    status: "completed",
    createdAt: "2025-11-25T10:00:00Z",
    pdfLink: "https://drive.google.com/file/d/mock-2025-CON-009",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "2026/IN/001",
    contractId: "CNT-005",
    clientName: "Anna Müller",
    clientEmail: "anna.mueller@example.com",
    language: "DE",
    issueDate: "2026-01-15",
    dueDate: "2026-01-22",
    amount: 1800,
    status: "paid",
    items: [
      { description: "German lessons - First installment", quantity: 1, rate: 1800 },
    ],
    pdfLink: "https://drive.google.com/file/d/mock-2026-IN-001",
  },
  {
    id: "INV-002",
    invoiceNumber: "2026/IN/002",
    contractId: "CNT-004",
    clientName: "Tech Innovations GmbH",
    clientEmail: "hr@techinnovations.ch",
    language: "EN",
    issueDate: "2026-01-18",
    dueDate: "2026-01-25",
    amount: 6000,
    status: "unpaid",
    items: [
      { description: "Corporate English training - Deposit", quantity: 1, rate: 6000 },
    ],
    pdfLink: "https://drive.google.com/file/d/mock-2026-IN-002",
  },
  {
    id: "INV-003",
    invoiceNumber: "2026/IN/003",
    contractId: "CNT-003",
    clientName: "Marco Rossi",
    clientEmail: "marco.rossi@example.com",
    language: "EN",
    issueDate: "2026-01-20",
    dueDate: "2026-01-27",
    amount: 2800,
    status: "unpaid",
    items: [
      { description: "Spanish lessons - Full payment", quantity: 1, rate: 2800 },
    ],
    pdfLink: "https://drive.google.com/file/d/mock-2026-IN-003",
  },
  {
    id: "INV-004",
    invoiceNumber: "2026/IN/004",
    contractId: "CNT-006",
    clientName: "Lisa Weber",
    clientEmail: "lisa.weber@example.com",
    language: "EN",
    issueDate: "2026-01-10",
    dueDate: "2026-01-17",
    amount: 3200,
    status: "overdue",
    items: [
      { description: "English lessons - Payment", quantity: 1, rate: 3200 },
    ],
    pdfLink: "https://drive.google.com/file/d/mock-2026-IN-004",
  },
  {
    id: "INV-005",
    invoiceNumber: "2026/IN/005",
    contractId: "CNT-002",
    clientName: "Global Solutions AG",
    clientEmail: "training@globalsolutions.ch",
    language: "DE",
    issueDate: "2026-01-22",
    dueDate: "2026-01-29",
    amount: 7750,
    status: "unpaid",
    items: [
      { description: "German corporate training - 50% deposit", quantity: 1, rate: 7750 },
    ],
    pdfLink: "https://drive.google.com/file/d/mock-2026-IN-005",
  },
];
