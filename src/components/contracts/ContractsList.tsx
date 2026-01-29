import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type Contract } from "@/lib/types";
import { fetchContracts } from "@/lib/api";
import { usePolling, formatLastUpdated } from "@/hooks/usePolling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function ContractsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Use polling hook for automatic data refresh (default: 5 minutes)
  const {
    data: contracts,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  } = usePolling<Contract[]>(fetchContracts);

  // Sort by latest first (contractDate desc)
  const sortedContracts = useMemo(() => {
    if (!contracts) return [];
    return [...contracts].sort((a, b) =>
      new Date(b.contractDate).getTime() - new Date(a.contractDate).getTime()
    );
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (!searchQuery) return sortedContracts;

    const query = searchQuery.toLowerCase();
    return sortedContracts.filter(
      (contract) =>
        contract.contractNumber.toLowerCase().includes(query) ||
        contract.program.toLowerCase().includes(query) ||
        contract.clientName?.toLowerCase().includes(query) ||
        contract.status?.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedContracts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
          <p className="text-muted-foreground mt-1">All client contracts</p>
        </div>
        <Button onClick={() => navigate("/dashboard/contracts/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Contract
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Contracts</CardTitle>
              <CardDescription>
                {filteredContracts.length} contract{filteredContracts.length !== 1 ? "s" : ""}
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
              placeholder="Search by contract number, program, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No.</TableHead>
                  <TableHead className="w-[130px]">Contract No.</TableHead>
                  <TableHead className="w-[100px]">Contract Date</TableHead>
                  <TableHead className="w-[120px]">Program</TableHead>
                  <TableHead className="w-[100px]">Start Date</TableHead>
                  <TableHead className="w-[100px]">Course End</TableHead>
                  <TableHead className="w-[70px] text-right">Hours</TableHead>
                  <TableHead className="text-right w-[100px]">Total Value</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[60px]">PDF</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading contracts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-red-600">
                        <p className="font-medium">Error loading contracts</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <p className="text-xs text-muted-foreground">Make sure the n8n data-fetch workflow is active</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      No contracts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <TableRow key={contract.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.contractDate}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.program}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.startDate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.courseEndDate}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {contract.totalHours}h
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {contract.totalAmount.toLocaleString()} CHF
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs capitalize px-2 py-1 rounded-full border",
                          contract.status === "active" ? statusColors.active :
                          contract.status === "completed" ? statusColors.completed :
                          statusColors.pending
                        )}>
                          {contract.status || "pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contract.pdfLink ? (
                          <a
                            href={contract.pdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/invoices/new?contractId=${contract.id}`);
                          }}
                          className="gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Invoice
                        </Button>
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
