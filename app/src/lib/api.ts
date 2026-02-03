import axios from "axios";
import { type Contract, type Invoice } from "./types";

// API Configuration
// Now using Vercel Serverless Functions instead of n8n for data fetching
const API_BASE_URL = "/api";

// Contracts API
export async function fetchContracts(): Promise<Contract[]> {
  try {
    console.log(`Fetching contracts from: ${API_BASE_URL}/contracts`);
    const response = await axios.get(`${API_BASE_URL}/contracts`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from API - expected an array of contracts");
    }

    // Data is already transformed by the serverless function
    const contracts: Contract[] = response.data;

    console.log(`Loaded ${contracts.length} contracts from API`);
    return contracts;
  } catch (error: any) {
    console.error("Error fetching contracts:", error.message || error);
    throw new Error(`Failed to fetch contracts: ${error.message || 'Network error'}`);
  }
}

// Invoices API
export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    console.log(`Fetching invoices from: ${API_BASE_URL}/invoices`);
    const response = await axios.get(`${API_BASE_URL}/invoices`);

    // Check if response is valid
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from API - expected an array of invoices");
    }

    // Data is already transformed by the serverless function
    const invoices: Invoice[] = response.data;

    console.log(`Loaded ${invoices.length} invoices from API`);
    return invoices;
  } catch (error: any) {
    console.error("Error fetching invoices:", error.message || error);
    throw new Error(`Failed to fetch invoices: ${error.message || 'Network error'}`);
  }
}
