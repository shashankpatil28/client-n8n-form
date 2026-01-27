import axios from "axios";
import { mockContracts, mockInvoices, type Contract, type Invoice } from "./mockData";

// API Configuration
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";
const API_BASE_URL = import.meta.env.VITE_N8N_API_BASE_URL || "";

// Contracts API
export async function fetchContracts(): Promise<Contract[]> {
  // Only use mock data if explicitly set to true
  if (USE_MOCK_DATA) {
    console.log("Using mock contracts data (VITE_USE_MOCK_DATA=true)");
    return mockContracts;
  }

  // If API URL is not set, use mock data with warning
  if (!API_BASE_URL) {
    console.warn("VITE_N8N_API_BASE_URL not set - using mock data");
    return mockContracts;
  }

  try {
    console.log(`Fetching contracts from: ${API_BASE_URL}/get-contracts`);
    const response = await axios.get(`${API_BASE_URL}/get-contracts`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      console.warn("Invalid response from API - using mock data");
      return mockContracts;
    }

    // Transform the response to match our Contract interface
    const contracts = response.data.map((row: any) => ({
      id: row["Contract Number"] || row.contractNumber || row.id,
      contractNumber: row["Contract Number"] || row.contractNumber,
      contractDate: row["Contract Date"] || row.contractDate,
      clientName: row["Client Name"] || row.clientName,
      email: row["Email"] || row.email,
      phone: row["Phone"] || row.phone,
      clientType: (row["Client Type"] || row.clientType || "private").toLowerCase(),
      companyName: row["Company Name"] || row.companyName,
      program: row["Program"] || row.program || "Private tuition",
      courseLang: row["Course Language"] || row.courseLang || "German",
      totalAmount: parseFloat(row["Total Amount"] || row.totalAmount || 0),
      status: (row["Status"] || row.status || "pending").toLowerCase(),
      createdAt: row["Created At"] || row.createdAt || new Date().toISOString(),
      pdfLink: row["Drive PDF Link"] || row.pdfLink || "",
    }));

    console.log(`Loaded ${contracts.length} contracts from API`);
    return contracts;
  } catch (error: any) {
    console.error("Error fetching contracts:", error.message || error);
    // Re-throw the error so the component can handle it
    throw new Error(`Failed to fetch contracts: ${error.message || 'Network error'}`);
  }
}

// Invoices API
export async function fetchInvoices(): Promise<Invoice[]> {
  // Only use mock data if explicitly set to true
  if (USE_MOCK_DATA) {
    console.log("Using mock invoices data (VITE_USE_MOCK_DATA=true)");
    return mockInvoices;
  }

  // If API URL is not set, use mock data with warning
  if (!API_BASE_URL) {
    console.warn("VITE_N8N_API_BASE_URL not set - using mock data");
    return mockInvoices;
  }

  try {
    console.log(`Fetching invoices from: ${API_BASE_URL}/get-invoices`);
    const response = await axios.get(`${API_BASE_URL}/get-invoices`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      console.warn("Invalid response from API - using mock data");
      return mockInvoices;
    }

    // Transform the response to match our Invoice interface
    const invoices = response.data.map((row: any) => ({
      id: row["Invoice Number"] || row.invoiceNumber || row.id,
      invoiceNumber: row["Invoice Number"] || row.invoiceNumber,
      contractId: row["Contract ID"] || row.contractId || "",
      clientName: row["Client Name"] || row.clientName,
      clientEmail: row["Client Email"] || row.clientEmail || "",
      language: (row["Language"] || row.language || "EN") === "English" ? "EN" :
                (row["Language"] || row.language || "EN") === "German" ? "DE" :
                (row["Language"] || row.language || "EN"),
      issueDate: row["Issue Date"] || row.issueDate,
      dueDate: row["Due Date"] || row.dueDate,
      amount: parseFloat(row["Amount"] || row.amount || 0),
      status: determineInvoiceStatus(row),
      items: parseItems(row["Items JSON"] || row.itemsJson || row["Items"] || "[]"),
      pdfLink: row["Drive PDF Link"] || row.pdfLink || "",
    }));

    console.log(`Loaded ${invoices.length} invoices from API`);
    return invoices;
  } catch (error: any) {
    console.error("Error fetching invoices:", error.message || error);
    // Re-throw the error so the component can handle it
    throw new Error(`Failed to fetch invoices: ${error.message || 'Network error'}`);
  }
}

// Helper: Determine invoice status based on due date and current status
function determineInvoiceStatus(row: any): "paid" | "unpaid" | "overdue" {
  const status = (row["Status"] || row.status || "unpaid").toLowerCase();
  if (status === "paid") return "paid";

  const dueDate = new Date(row["Due Date"] || row.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return "overdue";
  return "unpaid";
}

// Helper: Parse items from JSON string or array
function parseItems(items: string | any[]): Array<{ description: string; quantity: number; rate: number }> {
  try {
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        description: item.name || item.description || "",
        quantity: item.quantity || 1,
        rate: item.unitPrice || item.rate || 0,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
