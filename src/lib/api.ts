import axios from "axios";
import { type Contract, type Invoice } from "./types";

// API Configuration
const IS_DEV = import.meta.env.DEV;

// In development, use the Vite proxy to avoid CORS issues
// The proxy is configured in vite.config.ts to forward /api/n8n/* to the actual n8n URL
const API_BASE_URL = IS_DEV
  ? "/api/n8n"  // Use Vite proxy in development
  : (import.meta.env.VITE_N8N_API_BASE_URL || "");

// Contracts API
export async function fetchContracts(): Promise<Contract[]> {
  if (!API_BASE_URL) {
    throw new Error("VITE_N8N_API_BASE_URL is not configured. Please set it in your .env file.");
  }

  try {
    console.log(`Fetching contracts from: ${API_BASE_URL}/get-contracts`);
    const response = await axios.get(`${API_BASE_URL}/get-contracts`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from API - expected an array of contracts");
    }

    // Transform the response to match our Contract interface
    // Note: API returns fields with specific naming (some with leading/trailing spaces)
    const contracts: Contract[] = response.data.map((row: any) => ({
      id: row["Contract No"] || row["Contract Number"] || row.contractNumber || row.id,
      contractNumber: row["Contract No"] || row["Contract Number"] || row.contractNumber,
      contractDate: row["Contract Date"] || row.contractDate,
      clientNo: row["Client No"] || row.clientNo,
      clientName: row["Client Name"] || row.clientName || `Client ${row["Client No"] || ""}`,
      email: row["Email"] || row.email || "",
      phone: row["Phone"] || row.phone || "",
      clientType: (row["Client Type"] || row.clientType || "private").toLowerCase() as "private" | "business",
      companyName: row["Company Name"] || row.companyName || "",
      program: row["Program"] || row.program || "Private tuition",
      courseLang: row["Course Language"] || row.courseLang || "German",
      startDate: row[" Start Date"] || row["Start Date"] || row.startDate || "",
      validUntil: row["Valid Until"] || row.validUntil || "",
      courseEndDate: row["Course End Date "] || row["Course End Date"] || row.courseEndDate || "",
      totalHours: parseFloat(row["Total Hours"] || row.totalHours || 0),
      totalAmount: parseFloat(row["Total Value"] || row["Total Amount"] || row.totalAmount || 0),
      discount: parseFloat(row["Discounts"] || row["Discount"] || row.discount || 0),
      paymentSchedule: row["Full Payment Schedule"] || row.paymentSchedule || "",
      lessonPackages: row["Lesson Packages"] || row.lessonPackages || "",
      status: ((row["Status"] || row.status || "").toLowerCase() || "pending") as Contract["status"],
      createdAt: row["Created At"] || row["Contract Date"] || row.createdAt || new Date().toISOString(),
      pdfLink: row["Drive PDF Link"] || row.pdfLink || "",
    }));

    console.log(`Loaded ${contracts.length} contracts from API`);
    return contracts;
  } catch (error: any) {
    console.error("Error fetching contracts:", error.message || error);
    throw new Error(`Failed to fetch contracts: ${error.message || 'Network error'}`);
  }
}

// Invoices API
export async function fetchInvoices(): Promise<Invoice[]> {
  if (!API_BASE_URL) {
    throw new Error("VITE_N8N_API_BASE_URL is not configured. Please set it in your .env file.");
  }

  try {
    console.log(`Fetching invoices from: ${API_BASE_URL}/get-invoices`);
    const response = await axios.get(`${API_BASE_URL}/get-invoices`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from API - expected an array of invoices");
    }

    // Transform the response to match our Invoice interface
    const invoices: Invoice[] = response.data.map((row: any) => ({
      id: row["Invoice Number"] || row.invoiceNumber || row.id,
      invoiceNumber: row["Invoice Number"] || row.invoiceNumber,
      contractId: row["Contract ID"] || row.contractId || "",
      clientName: row["Client Name"] || row.clientName,
      clientEmail: row["Client Email"] || row.clientEmail || "",
      language: ((row["Language"] || row.language || "EN") === "English" ? "EN" :
                (row["Language"] || row.language || "EN") === "German" ? "DE" :
                (row["Language"] || row.language || "EN")) as "EN" | "DE",
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
