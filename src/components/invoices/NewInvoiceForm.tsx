import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/invoiceSchema";
import { fetchContracts } from "@/lib/api";
import { type Contract } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StepIndicator from "@/components/ui/step-indicator";
import { Trash2, Plus } from "lucide-react";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  const loadContracts = useCallback(async () => {
    if (contracts.length > 0 || isLoadingContracts) {
      return;
    }
    setIsLoadingContracts(true);
    try {
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error("Failed to load contracts:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load contracts. Using offline mode.",
      });
    } finally {
      setIsLoadingContracts(false);
    }
  }, [contracts.length, isLoadingContracts, toast]);

  const contractId = searchParams.get("contractId");
  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === contractId),
    [contractId, contracts]
  );

  const countries = useMemo(() => countryList().getData(), []);

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
      } else {
        fieldsToValidate.push(
          "debtorName",
          "debtorAddress",
          "debtorCity",
          "debtorZip",
          "debtorCountry"
        );
      }
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

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);

    try {
      // Find client info
      let debtorName = "";
      let debtorEmail = "";
      let debtorStreet = "";
      let debtorHouse = "";
      let debtorApt = "";
      let debtorCity = "";
      let debtorZip = "";
      let debtorCountry = "";

      if (data.debtorType === "existing" && data.existingClientId) {
        const client = contracts.find((c) => c.id === data.existingClientId);
        if (client) {
          debtorName = client.clientName;
          debtorEmail = client.email;
          // For existing clients, we'll use placeholder address (in real app, this would come from contract data)
          debtorStreet = "Contract Address";
          debtorHouse = "";
          debtorCity = "Zurich";
          debtorZip = "8000";
          debtorCountry = "Switzerland";
        }
      } else {
        debtorName = data.debtorName || "";
        debtorEmail = data.debtorEmail || "";
        debtorStreet = data.debtorAddress || "";
        debtorHouse = data.debtorBuilding || "";
        debtorApt = data.debtorApartment || "";
        debtorCity = data.debtorCity || "";
        debtorZip = data.debtorZip || "";
        debtorCountry = data.debtorCountry || "";
      }

      // Build n8n payload - matching the workflow expected format
      const payload = {
        body: {
          language: data.language === "EN" ? "English" : "German",
          debtorName,
          debtorEmail,
          debtorStreet,
          debtorHouse,
          debtorApt,
          debtorCity,
          debtorZip,
          debtorCountry,
          contractNumber: data.contractNumber || "",
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

      console.log("Submitting invoice:", payload);

      // Send to n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_INVOICE_WEBHOOK_URL;
      if (webhookUrl) {
        await axios.post(webhookUrl, payload);
      } else {
        console.warn("VITE_N8N_INVOICE_WEBHOOK_URL not configured - skipping webhook submission");
      }

      toast({
        title: "Invoice Created!",
        description: `Invoice ${data.invoiceNumber} for ${total.toFixed(2)} CHF has been created.`,
      });

      setTimeout(() => {
        navigate("/dashboard/invoices");
      }, 1500);
    } catch (error) {
      console.error("Invoice submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not create invoice. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {selectedContract ? `For contract: ${selectedContract.contractNumber}` : "Manual invoice creation"}
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStepIndex={currentStep} />

      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    onValueChange={(value) => form.setValue("debtorType", value as "existing" | "custom")}
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
                  <div className="space-y-2">
                    <Label htmlFor="existingClient" className="text-sm font-semibold">
                      Select Client *
                    </Label>
                    <Select
                      value={form.watch("existingClientId")}
                      onValueChange={(value) => form.setValue("existingClientId", value)}
                      onOpenChange={(open) => {
                        if (open) {
                          loadContracts();
                        }
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={isLoadingContracts ? "Loading contracts..." : "Choose a client..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingContracts ? (
                          <SelectItem value="_loading" disabled>Loading contracts...</SelectItem>
                        ) : contracts.length === 0 ? (
                          <SelectItem value="_empty" disabled>No contracts available</SelectItem>
                        ) : (
                          contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.contractNumber} - {contract.clientName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.existingClientId && (
                      <p className="text-xs text-destructive">{form.formState.errors.existingClientId.message}</p>
                    )}
                  </div>
                )}

                {/* Custom Debtor Fields */}
                {debtorType === "custom" && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-slate-700">Debtor Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="debtorName" className="text-sm">
                          Name *
                        </Label>
                        <Input
                          id="debtorName"
                          {...form.register("debtorName")}
                          className="mt-1.5 h-11"
                          placeholder="Company or person name"
                        />
                        {form.formState.errors.debtorName && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.debtorName.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="debtorEmail" className="text-sm">
                          Email
                        </Label>
                        <Input
                          id="debtorEmail"
                          type="email"
                          {...form.register("debtorEmail")}
                          className="mt-1.5 h-11"
                          placeholder="email@example.com"
                        />
                        {form.formState.errors.debtorEmail && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.debtorEmail.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="debtorAddress" className="text-sm">
                          Address *
                        </Label>
                        <Input
                          id="debtorAddress"
                          {...form.register("debtorAddress")}
                          className="mt-1.5 h-11"
                          placeholder="Street address"
                        />
                        {form.formState.errors.debtorAddress && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.debtorAddress.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="debtorBuilding" className="text-sm">
                          Building Number
                        </Label>
                        <Input id="debtorBuilding" {...form.register("debtorBuilding")} className="mt-1.5 h-11" />
                      </div>
                      <div>
                        <Label htmlFor="debtorApartment" className="text-sm">
                          Apartment
                        </Label>
                        <Input id="debtorApartment" {...form.register("debtorApartment")} className="mt-1.5 h-11" />
                      </div>
                      <div>
                        <Label htmlFor="debtorCity" className="text-sm">
                          City *
                        </Label>
                        <Input
                          id="debtorCity"
                          {...form.register("debtorCity")}
                          className="mt-1.5 h-11"
                        />
                        {form.formState.errors.debtorCity && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.debtorCity.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="debtorZip" className="text-sm">
                          ZIP Code *
                        </Label>
                        <Input id="debtorZip" {...form.register("debtorZip")} className="mt-1.5 h-11" />
                        {form.formState.errors.debtorZip && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.debtorZip.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="debtorCountry" className="text-sm">
                          Country *
                        </Label>
                        <Select
                          value={form.watch("debtorCountry")}
                          onValueChange={(value) => form.setValue("debtorCountry", value)}
                        >
                          <SelectTrigger className="mt-1.5 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c: any) => (
                              <SelectItem key={c.value} value={c.label}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <div>
                    <Label className="text-sm font-semibold">Contract Number</Label>
                    <Input
                      value={form.watch("contractNumber") || "—"}
                      disabled
                      className="mt-1.5 h-11 bg-slate-50"
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="issueDate" className="text-sm font-semibold">
                      Issue Date *
                    </Label>
                    <Input
                      id="issueDate"
                      type="date"
                      {...form.register("issueDate")}
                      className="mt-1.5 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate" className="text-sm font-semibold">
                      Due Date *
                    </Label>
                    <Input id="dueDate" type="date" {...form.register("dueDate")} className="mt-1.5 h-11" />
                  </div>
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
                          <Label className="text-xs">Description *</Label>
                          <Input
                            {...form.register(`items.${index}.description`)}
                            className="mt-1 h-10"
                            placeholder="Item description"
                          />
                        </div>
                        {itemFields.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="mt-5 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit *</Label>
                          <Select
                            value={form.watch(`items.${index}.unit`)}
                            onValueChange={(value) => form.setValue(`items.${index}.unit`, value as "hrs" | "qty")}
                          >
                            <SelectTrigger className="mt-1 h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hrs">Hours</SelectItem>
                              <SelectItem value="qty">Quantity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Unit Price (CHF) *</Label>
                          <Input
                            type="number"
                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="mt-1 h-10"
                          />
                        </div>
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
                <div>
                  <Label htmlFor="discount" className="text-sm font-semibold">
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("discount", { valueAsNumber: true })}
                    className="mt-1.5 h-11"
                  />
                  {discount > 0 && (
                    <p className="text-xs text-green-600 mt-1">-{discountAmount.toFixed(2)} CHF discount applied</p>
                  )}
                </div>

                {/* Extra Note */}
                <div>
                  <Label htmlFor="extraNote" className="text-sm font-semibold">
                    Extra Note
                  </Label>
                  <Textarea
                    id="extraNote"
                    {...form.register("extraNote")}
                    className="mt-1.5"
                    rows={4}
                    placeholder="Additional notes or payment instructions..."
                  />
                </div>

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
                      <div key={field.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Amount (CHF)</Label>
                          <Input
                            type="number"
                            {...form.register(`installments.${index}.amount`, { valueAsNumber: true })}
                            className="mt-1 h-10"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            {...form.register(`installments.${index}.date`)}
                            className="mt-1 h-10"
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
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
                        <span className="font-semibold">Client:</span>{" "}
                        {contracts.find((c) => c.id === form.watch("existingClientId"))?.clientName}
                      </p>
                    )}
                    {debtorType === "custom" && (
                      <>
                        <p>
                          <span className="font-semibold">Name:</span> {form.watch("debtorName")}
                        </p>
                        <p>
                          <span className="font-semibold">Address:</span> {form.watch("debtorAddress")},{" "}
                          {form.watch("debtorCity")}, {form.watch("debtorZip")}, {form.watch("debtorCountry")}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Invoice Details</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
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
              onClick={() => navigate("/dashboard/invoices")}
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
              <Button type="submit" disabled={isSubmitting} className="h-11 px-8 bg-green-600 hover:bg-green-700">
                {isSubmitting ? "Submitting..." : "Create Invoice"}
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
