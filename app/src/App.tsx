import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Dashboard from "@/pages/Dashboard";
import ContractsPage from "@/pages/ContractsPage";
import NewContractPage from "@/pages/NewContractPage";
import InvoicesPage from "@/pages/InvoicesPage";
import NewInvoicePage from "@/pages/NewInvoicePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/new" element={<NewContractPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/new" element={<NewInvoicePage />} />
        </Route>
      </Routes>

      {/* Toast notifications */}
      <Toaster />
    </BrowserRouter>
  );
}