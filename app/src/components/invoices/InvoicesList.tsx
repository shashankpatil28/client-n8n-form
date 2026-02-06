"use client"

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type Invoice } from "@/lib/types";
import { fetchInvoices } from "@/lib/api";
import { usePolling, formatLastUpdated } from "@/hooks/usePolling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200",
  unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
};

export default function InvoicesList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Use polling hook for automatic data refresh (default: 5 minutes)
  const {
    data: invoices,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  } = usePolling<Invoice[]>(fetchInvoices);

  // Sort by latest first (issueDate desc)
  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) =>
      new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return sortedInvoices;

    const query = searchQuery.toLowerCase();
    return sortedInvoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.clientName?.toLowerCase().includes(query) ||
        invoice.contractId?.toLowerCase().includes(query) ||
        invoice.status?.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedInvoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-muted-foreground mt-1">All client invoices</p>
        </div>
        <Button onClick={() => router.push("/dashboard/invoices/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {lastUpdated && (
                  <span className="text-xs">
                    Last updated: {formatLastUpdated(lastUpdated)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={isRefreshing}
                title="Refresh data"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              Error: {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredInvoices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No invoices found</p>
            </div>
          )}

          {!isLoading && filteredInvoices.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.contractId || '-'}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.amount.toLocaleString()} {invoice.currency || 'CHF'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                            statusColors[invoice.status as keyof typeof statusColors] || statusColors.unpaid
                          )}
                        >
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.pdfLink ? (
                          <a
                            href={invoice.pdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredInvoices.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {sortedInvoices.length} invoices
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
