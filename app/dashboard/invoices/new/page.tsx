"use client"

import { Suspense } from "react";
import NewInvoiceForm from "@/components/invoices/NewInvoiceForm";

function NewInvoiceFormWrapper() {
  return <NewInvoiceForm />;
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NewInvoiceFormWrapper />
    </Suspense>
  );
}
