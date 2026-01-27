import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Contract } from "@/lib/mockData";
import { fetchContracts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ExternalLink, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function ContractsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContracts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchContracts();
        setContracts(data);
      } catch (err: any) {
        console.error("Failed to load contracts:", err);
        setError(err.message || "Failed to load contracts");
      } finally {
        setIsLoading(false);
      }
    };
    loadContracts();
  }, []);

  // Sort by latest first (createdAt desc)
  const sortedContracts = useMemo(() => {
    return [...contracts].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (!searchQuery) return sortedContracts;

    const query = searchQuery.toLowerCase();
    return sortedContracts.filter(
      (contract) =>
        contract.clientName.toLowerCase().includes(query) ||
        contract.email.toLowerCase().includes(query) ||
        contract.contractNumber.toLowerCase().includes(query) ||
        contract.companyName?.toLowerCase().includes(query)
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
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            {filteredContracts.length} contract{filteredContracts.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name, email, or contract number..."
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
                  <TableHead className="w-[140px]">Contract No.</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[100px]">Language</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                  <TableHead className="w-[100px]">PDF</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading contracts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-red-600">
                        <p className="font-medium">Error loading contracts</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <p className="text-xs text-muted-foreground">Make sure the n8n data-fetch workflow is active</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No contracts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <TableRow key={contract.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.clientName}</p>
                          {contract.companyName && (
                            <p className="text-xs text-muted-foreground">{contract.companyName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.email}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize px-2 py-1 rounded-full bg-slate-100">
                          {contract.clientType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{contract.courseLang}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {contract.totalAmount.toLocaleString()} CHF
                      </TableCell>
                      <TableCell>
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
                          Create Invoice
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
