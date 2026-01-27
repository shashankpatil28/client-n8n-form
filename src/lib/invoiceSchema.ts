import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.enum(["hrs", "qty"]),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

export const installmentSchema = z.object({
  amount: z.number().min(0, "Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

export const invoiceFormSchema = z.object({
  // Step 1: Language & Debtor
  language: z.enum(["EN", "DE"]),
  debtorType: z.enum(["existing", "custom"]),
  existingClientId: z.string().optional(),

  // Custom debtor fields (required only if debtorType === "custom")
  debtorName: z.string().optional(),
  debtorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  debtorAddress: z.string().optional(),
  debtorBuilding: z.string().optional(),
  debtorApartment: z.string().optional(),
  debtorCity: z.string().optional(),
  debtorZip: z.string().optional(),
  debtorCountry: z.string().optional(),

  // Step 2: Invoice Details
  contractNumber: z.string().optional(), // Read-only, auto-filled
  invoiceNumber: z.string(), // Auto-generated YYYY/IN/XXX
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),

  // Step 3: Extra Options
  discount: z.number().min(0).max(100).optional(),
  extraNote: z.string().optional(),
  installments: z.array(installmentSchema).max(9, "Maximum 9 installments allowed").optional(),
}).superRefine((data, ctx) => {
  // Validate debtor fields based on debtorType
  if (data.debtorType === "existing" && !data.existingClientId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a client",
      path: ["existingClientId"],
    });
  }

  if (data.debtorType === "custom") {
    if (!data.debtorName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debtor name is required",
        path: ["debtorName"],
      });
    }
    if (!data.debtorAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required",
        path: ["debtorAddress"],
      });
    }
    if (!data.debtorCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["debtorCity"],
      });
    }
    if (!data.debtorZip) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ZIP code is required",
        path: ["debtorZip"],
      });
    }
    if (!data.debtorCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required",
        path: ["debtorCountry"],
      });
    }
  }
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
