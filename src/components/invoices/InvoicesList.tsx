import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type Invoice } from "@/lib/types";
import { fetchInvoices } from "@/lib/api";
import { usePolling, formatLastUpdated } from "@/hooks/usePolling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200",
  unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
};

export default function InvoicesList() {
  const navigate = useNavigate();
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
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedInvoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-muted-foreground mt-1">All client invoices</p>
        </div>
        <Button onClick={() => navigate("/dashboard/invoices/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
                {lastUpdated && (
                  <span className="ml-2 text-xs">
                    (Updated {formatLastUpdated(lastUpdated)})
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No.</TableHead>
                  <TableHead className="w-[140px]">Invoice No.</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="w-[120px]">Contract ID</TableHead>
                  <TableHead className="w-[120px]">Invoice Date</TableHead>
                  <TableHead className="w-[120px]">Due Date</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                  <TableHead className="w-[100px]">Language</TableHead>
                  <TableHead className="w-[100px]">PDF</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading invoices...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-red-600">
                        <p className="font-medium">Error loading invoices</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <p className="text-xs text-muted-foreground">Make sure the n8n data-fetch workflow is active</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-medium">No invoices yet</p>
                        <p className="text-sm">Create your first invoice to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium">{invoice.clientName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.contractId || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.issueDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {invoice.amount.toLocaleString()} CHF
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          invoice.language === "EN" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        )}>
                          {invoice.language}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={invoice.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
                            statusColors[invoice.status]
                          )}
                        >
                          {invoice.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
