"use client"

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        contract.clientNo?.toString().includes(query)
    );
  }, [searchQuery, sortedContracts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
          <p className="text-muted-foreground mt-1">All client contracts</p>
        </div>
        <Button onClick={() => router.push("/dashboard/contracts/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Contract
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract List</CardTitle>
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
                  placeholder="Search contracts..."
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

          {!isLoading && filteredContracts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contracts found</p>
            </div>
          )}

          {!isLoading && filteredContracts.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract No</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount (CHF)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                      <TableCell>{contract.clientName || `Client #${contract.clientNo}`}</TableCell>
                      <TableCell>{contract.contractDate}</TableCell>
                      <TableCell>{contract.program}</TableCell>
                      <TableCell>{contract.startDate}</TableCell>
                      <TableCell>{contract.courseEndDate}</TableCell>
                      <TableCell className="text-right">{contract.totalHours}</TableCell>
                      <TableCell className="text-right font-medium">
                        {contract.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            statusColors[contract.status as keyof typeof statusColors] || statusColors.active
                          )}
                        >
                          {contract.status || 'Active'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredContracts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredContracts.length} of {sortedContracts.length} contracts
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
