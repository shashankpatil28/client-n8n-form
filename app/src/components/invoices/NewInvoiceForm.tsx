"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/invoiceSchema";
import { fetchContracts, fetchClients } from "@/lib/api";
import { type Contract, type Client } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import StepIndicator from "@/components/ui/step-indicator";
import InvoiceThankYouCard from "@/components/InvoiceThankYouCard";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import countryList from "react-select-country-list";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "debtor", title: "Debtor", description: "Language & Client" },
  { id: "details", title: "Invoice", description: "Details & Items" },
  { id: "options", title: "Options", description: "Discount & Notes" },
  { id: "review", title: "Review", description: "Confirm & Submit" },
];

// Helper: Generate invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const nextNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `${year}/IN/${nextNum}`;
};

export default function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [contractsFetched, setContractsFetched] = useState(false);
  const [clientsFetched, setClientsFetched] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const contractId = searchParams.get("contractId");
  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === contractId),
    [contractId, contracts]
  );

  const countries = useMemo(() => countryList().getData(), []);

  // Lazy load contracts when user selects "existing client"
  const loadContracts = async () => {
    if (contractsFetched) return; // Already fetched

    setIsLoadingContracts(true);
    setContractsError(null);
    try {
      const data = await fetchContracts();
      setContracts(data);
      setContractsFetched(true);
    } catch (err: any) {
      console.error("Failed to load contracts:", err);
      setContractsError(err.message || "Failed to load contracts");
    } finally {
      setIsLoadingContracts(false);
    }
  };

  // Lazy load clients when user selects "existing client"
  const loadClients = async () => {
    if (clientsFetched) return; // Already fetched

    setIsLoadingClients(true);
    setClientsError(null);
    try {
      const data = await fetchClients();
      setClients(data);
      setClientsFetched(true);
    } catch (err: any) {
      console.error("Failed to load clients:", err);
      setClientsError(err.message || "Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Load both contracts and clients when "existing" is selected
  const loadContractsAndClients = async () => {
    await Promise.all([loadContracts(), loadClients()]);
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    mode: "onChange",
    defaultValues: {
      language: "EN",
      debtorType: selectedContract ? "existing" : "custom",
      existingClientId: selectedContract?.id || "",
      debtorName: "",
      debtorEmail: "",
      debtorAddress: "",
      debtorBuilding: "",
      debtorApartment: "",
      debtorCity: "",
      debtorZip: "",
      debtorCountry: "Switzerland",
      contractNumber: selectedContract?.contractNumber || "",
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [{ description: "", quantity: 1, unit: "hrs", unitPrice: 0 }],
      discount: 0,
      extraNote: "",
      installments: [],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: installmentFields, append: appendInstallment, remove: removeInstallment } = useFieldArray({
    control: form.control,
    name: "installments",
  });

  const debtorType = useWatch({ control: form.control, name: "debtorType" });
  const items = useWatch({ control: form.control, name: "items" }) || [];
  const discount = useWatch({ control: form.control, name: "discount" }) || 0;

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + (item?.quantity || 0) * (item?.unitPrice || 0),
    0
  );
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const next = async () => {
    let fieldsToValidate: string[] = [];

    if (currentStep === 0) {
      fieldsToValidate = ["language", "debtorType"];
      if (debtorType === "existing") {
        fieldsToValidate.push("existingClientId");
      }
      // Always require debtor details for invoice
      fieldsToValidate.push(
        "debtorName",
        "debtorAddress",
        "debtorCity",
        "debtorZip",
        "debtorCountry"
      );
    } else if (currentStep === 1) {
      fieldsToValidate = ["invoiceNumber", "issueDate", "dueDate", "items"];
    } else if (currentStep === 2) {
      // Optional fields, no validation needed
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please complete all required fields.",
      });
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Manual submit handler - ONLY called when submit button is clicked
  const handleManualSubmit = async () => {
    // Validate all fields
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please complete all required fields correctly.",
      });
      return;
    }

    const data = form.getValues();
    setIsSubmitting(true);

    try {
      console.log("Submitting invoice to API...", data);

      // Build n8n payload - matching the workflow expected format
      const payload = {
        body: {
          language: data.language === "EN" ? "English" : "German",
          debtorName: data.debtorName || "",
          debtorEmail: data.debtorEmail || "",
          debtorStreet: data.debtorAddress || "",
          debtorHouse: data.debtorBuilding || "",
          debtorApt: data.debtorApartment || "",
          debtorCity: data.debtorCity || "",
          debtorZip: data.debtorZip || "",
          debtorCountry: data.debtorCountry || "",
          contractNumber: data.contractNumber || "",
          invoiceNumber: data.invoiceNumber,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          items: data.items.map(item => ({
            name: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
          })),
          discount: data.discount || 0,
          extraNote: data.extraNote || "",
          installments: (data.installments || []).map(inst => ({
            date: inst.date,
            amount: inst.amount,
          })),
        },
      };

      console.log("Submitting invoice via API proxy:", payload);

      // Use Next.js API route proxy instead of direct n8n webhook call
      const response = await axios.post("/api/submit-invoice", payload);
      console.log("Invoice submission response:", response.data);

      // Show success state
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Invoice submission error:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Provide helpful error messages
      let errorTitle = "Submission Failed";
      let errorDescription = "Could not create invoice. Please try again.";

      if (error.response?.data?.message) {
        const message = error.response.data.message;

        if (message.includes('workflow is not active')) {
          errorTitle = "n8n Workflow Inactive";
          errorDescription = "The n8n workflow is not active. Please activate it in your n8n dashboard and try again.";
        } else if (message.includes('blocked by firewall')) {
          errorTitle = "Network Error";
          errorDescription = "Webhook is blocked by firewall/proxy. Please check your network settings or contact IT support.";
        } else if (message.includes('webhook not found')) {
          errorTitle = "Configuration Error";
          errorDescription = "Webhook URL is not configured correctly. Please check your environment variables.";
        } else {
          errorDescription = message;
        }
      } else if (error.message) {
        errorDescription = error.message;
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show thank you card after successful submission
  if (isSubmitted) {
    return <InvoiceThankYouCard />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {selectedContract ? `For contract: ${selectedContract.contractNumber}` : "Manual invoice creation"}
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStepIndex={currentStep} />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Prevent default form submission completely
            e.preventDefault();
            console.log("Form submit event prevented");
          }}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form
            // Allow Enter in textareas and on buttons only
            if (
              e.key === 'Enter' &&
              e.target instanceof HTMLElement &&
              e.target.tagName !== 'TEXTAREA' &&
              e.target.tagName !== 'BUTTON'
            ) {
              e.preventDefault();
            }
          }}
        >
          <Card className="shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">{STEPS[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 min-h-[400px]">
            {/* STEP 1: Debtor Details */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Invoice Language *</Label>
                  <RadioGroup
                    value={form.watch("language")}
                    onValueChange={(value) => form.setValue("language", value as "EN" | "DE")}
                    className="grid grid-cols-2 gap-3"
                  >
                    {["EN", "DE"].map((lang) => (
                      <label
                        key={lang}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                          form.watch("language") === lang
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <RadioGroupItem value={lang} className="sr-only" />
                        <span className="text-sm font-semibold">{lang === "EN" ? "English" : "German"}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Debtor Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Debtor Selection *</Label>
                  <RadioGroup
                    value={form.watch("debtorType")}
                    onValueChange={(value) => {
                      form.setValue("debtorType", value as "existing" | "custom");
                      // Fetch contracts and clients when "existing" is selected
                      if (value === "existing") {
                        loadContractsAndClients();
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <label
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        form.watch("debtorType") === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <RadioGroupItem value="existing" className="sr-only" />
                      <span className="text-sm font-semibold">Use Existing Client</span>
                      <span className="text-xs text-muted-foreground">Select from contracts</span>
                    </label>
                    <label
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        form.watch("debtorType") === "custom"
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <RadioGroupItem value="custom" className="sr-only" />
                      <span className="text-sm font-semibold">Custom Debtor</span>
                      <span className="text-xs text-muted-foreground">Enter manually</span>
                    </label>
                  </RadioGroup>
                </div>

                {/* Existing Client Selection */}
                {debtorType === "existing" && (
                  <div className="space-y-4">
                    {/* Show error alert if contracts or clients failed to load */}
                    {(contractsError || clientsError) && (
                      <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {contractsError || clientsError}. Please try switching to "Custom Debtor" or refresh the page.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Show warning if no contracts available */}
                    {!isLoadingContracts && !contractsError && contractsFetched && contracts.length === 0 && (
                      <Alert className="border-amber-500/50 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-900">
                          <div className="space-y-2">
                            <p className="font-semibold">No contracts found</p>
                            <p>You need to create a contract before you can generate an invoice for an existing client.</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2 border-amber-600 text-amber-900 hover:bg-amber-100"
                              onClick={() => router.push("/dashboard/contracts/new")}
                            >
                              Create Contract First
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="existingClientId"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-semibold">Select Contract *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);

                              // Auto-fill contract number and client details when contract is selected
                              const selectedContract = contracts.find(c => c.id === value);
                              if (selectedContract) {
                                form.setValue("contractNumber", selectedContract.contractNumber);

                                // Find matching client by clientNo
                                const matchingClient = clients.find(client =>
                                  client.clientNo === selectedContract.clientNo ||
                                  client.contractId === selectedContract.contractNumber
                                );

                                if (matchingClient) {
                                  // Auto-fill all client details
                                  form.setValue("debtorName", matchingClient.fullName);
                                  form.setValue("debtorEmail", matchingClient.email);
                                  form.setValue("debtorAddress", matchingClient.street);
                                  form.setValue("debtorBuilding", matchingClient.building);
                                  form.setValue("debtorApartment", matchingClient.apartment);
                                  form.setValue("debtorCity", matchingClient.city);
                                  form.setValue("debtorZip", matchingClient.zip);
                                  form.setValue("debtorCountry", matchingClient.country || "Switzerland");

                                  toast({
                                    title: "Client Details Loaded",
                                    description: `Auto-filled details for ${matchingClient.fullName}`,
                                  });
                                } else {
                                  toast({
                                    variant: "default",
                                    title: "Contract Selected",
                                    description: "Please fill in client details manually",
                                  });
                                }
                              }
                            }}
                            value={field.value}
                            disabled={isLoadingContracts || isLoadingClients || contracts.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder={
                                  isLoadingContracts || isLoadingClients
                                    ? "Loading..."
                                    : "Choose a contract..."
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(isLoadingContracts || isLoadingClients) ? (
                                <SelectItem value="_loading" disabled>Loading...</SelectItem>
                              ) : contracts.length === 0 ? (
                                <SelectItem value="_empty" disabled>No contracts available</SelectItem>
                              ) : (
                                contracts.map((contract) => {
                                  // Find matching client for display
                                  const client = clients.find(c =>
                                    c.clientNo === contract.clientNo ||
                                    c.contractId === contract.contractNumber
                                  );

                                  return (
                                    <SelectItem key={contract.id} value={contract.id}>
                                      {contract.contractNumber} - {client ? client.fullName : `Client #${contract.clientNo}`}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[11px] font-medium" />
                        </FormItem>
                      )}
                    />

                    {/* Client details for existing contract */}
                    <div className="border-t pt-4 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700">Client Information</h3>
                      <p className="text-xs text-muted-foreground -mt-2">
                        Enter the client's name and address details for the invoice
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="debtorName"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 sm:col-span-2">
                              <FormLabel className="text-sm font-medium">Name & Surname *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-11"
                                  placeholder="John Doe"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                        <div className="sm:col-span-2">
                          <FormField
                            control={form.control}
                            name="debtorEmail"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    className="h-11"
                                    placeholder="email@example.com"
                                  />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FormField
                            control={form.control}
                            name="debtorAddress"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">Address *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="h-11"
                                    placeholder="Street address"
                                  />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="debtorBuilding"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">Building Number</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-11" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="debtorApartment"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">Apartment</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-11" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="debtorCity"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">City *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-11" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="debtorZip"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">ZIP Code *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-11" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FormField
                            control={form.control}
                            name="debtorCountry"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium">Country *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {countries.map((c: any) => (
                                      <SelectItem key={c.value} value={c.label}>
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Debtor Fields */}
                {debtorType === "custom" && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-slate-700">Debtor Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="debtorName"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Name *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-11"
                                  placeholder="Company or person name"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="debtorEmail"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Email</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  className="h-11"
                                  placeholder="email@example.com"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="debtorAddress"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Address *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-11"
                                  placeholder="Street address"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="debtorBuilding"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Building Number</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="debtorApartment"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Apartment</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="debtorCity"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">City *</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="debtorZip"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">ZIP Code *</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="debtorCountry"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium">Country *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {countries.map((c: any) => (
                                    <SelectItem key={c.value} value={c.label}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Invoice Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Contract & Invoice Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-semibold">Contract Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter contract number"
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-[11px] font-medium" />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label className="text-sm font-semibold">Invoice Number</Label>
                    <Input
                      value={form.watch("invoiceNumber")}
                      disabled
                      className="mt-1.5 h-11 bg-slate-50 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-semibold">Issue Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage className="text-[11px] font-medium" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-semibold">Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage className="text-[11px] font-medium" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invoice Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Invoice Items *</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => appendItem({ description: "", quantity: 1, unit: "hrs", unitPrice: 0 })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {itemFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs font-medium">Description *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10" placeholder="Item description" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        {itemFields.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="mt-6 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-xs font-medium">Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-xs font-medium">Unit *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hrs">Hours</SelectItem>
                                  <SelectItem value="qty">Quantity</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-xs font-medium">Unit Price (CHF) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="text-right text-sm font-semibold text-primary">
                        Line Total: {((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)).toFixed(2)} CHF
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Display */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} CHF</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Extra Options */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Discount */}
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-semibold">Discount (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-11"
                        />
                      </FormControl>
                      {discount > 0 && (
                        <p className="text-xs text-green-600 mt-1">-{discountAmount.toFixed(2)} CHF discount applied</p>
                      )}
                      <FormMessage className="text-[11px] font-medium" />
                    </FormItem>
                  )}
                />

                {/* Extra Note */}
                <FormField
                  control={form.control}
                  name="extraNote"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-semibold">Extra Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Additional notes or payment instructions..."
                        />
                      </FormControl>
                      <FormMessage className="text-[11px] font-medium" />
                    </FormItem>
                  )}
                />

                {/* Installments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Installments (Max 9)</Label>
                    {installmentFields.length < 9 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => appendInstallment({ amount: 0, date: "" })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>

                  {installmentFields.length > 0 ? (
                    installmentFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`installments.${index}.amount`}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs font-medium">Amount (CHF)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`installments.${index}.date`}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs font-medium">Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="h-10" />
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="mt-6 text-destructive"
                          onClick={() => removeInstallment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No installments added</p>
                  )}
                </div>

                {/* Total Display */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} CHF</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Discount ({discount}%)</span>
                      <span>-{discountAmount.toFixed(2)} CHF</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-primary border-t pt-2">
                    <span>Final Total</span>
                    <span>{total.toFixed(2)} CHF</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Review Invoice</h3>

                {/* Client Info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Client Information</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {debtorType === "existing" ? "Existing Client" : "Custom Debtor"}
                    </p>
                    {debtorType === "existing" && form.watch("existingClientId") && (
                      <p>
                        <span className="font-semibold">Contract:</span>{" "}
                        {contracts.find((c) => c.id === form.watch("existingClientId"))?.contractNumber}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Name:</span> {form.watch("debtorName")}
                    </p>
                    {form.watch("debtorEmail") && (
                      <p>
                        <span className="font-semibold">Email:</span> {form.watch("debtorEmail")}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Address:</span> {form.watch("debtorAddress")}
                      {form.watch("debtorBuilding") && `, ${form.watch("debtorBuilding")}`}
                      {form.watch("debtorApartment") && `, ${form.watch("debtorApartment")}`}
                      {", "}
                      {form.watch("debtorCity")}, {form.watch("debtorZip")}, {form.watch("debtorCountry")}
                    </p>
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Invoice Details</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                    {form.watch("contractNumber") && (
                      <p>
                        <span className="font-semibold">Contract Number:</span> {form.watch("contractNumber")}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Invoice Number:</span> {form.watch("invoiceNumber")}
                    </p>
                    <p>
                      <span className="font-semibold">Language:</span> {form.watch("language") === "EN" ? "English" : "German"}
                    </p>
                    <p>
                      <span className="font-semibold">Issue Date:</span> {form.watch("issueDate")}
                    </p>
                    <p>
                      <span className="font-semibold">Due Date:</span> {form.watch("dueDate")}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2">Description</th>
                          <th className="text-center p-2">Qty</th>
                          <th className="text-center p-2">Unit</th>
                          <th className="text-right p-2">Unit Price</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-center p-2">{item.unit}</td>
                            <td className="text-right p-2">{item.unitPrice.toFixed(2)} CHF</td>
                            <td className="text-right p-2 font-semibold">
                              {(item.quantity * item.unitPrice).toFixed(2)} CHF
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Final Total */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} CHF</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount ({discount}%)</span>
                      <span>-{discountAmount.toFixed(2)} CHF</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-primary border-t pt-2">
                    <span>Final Total</span>
                    <span>{total.toFixed(2)} CHF</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer with navigation buttons */}
          <div className="border-t p-4 sm:p-6 flex items-center gap-3 bg-slate-50">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={prev} className="h-11">
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/dashboard/invoices")}
              className="h-11"
            >
              Cancel
            </Button>
            <div className="flex-1" />
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={next} className="h-11 px-8">
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="h-11 px-8 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Create Invoice"}
              </Button>
            )}
          </div>
        </Card>
      </form>
      </Form>
    </div>
  );
}
