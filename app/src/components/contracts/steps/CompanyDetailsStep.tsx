"use client"

import { Separator } from "@/components/ui/separator";
import TextField from "@/components/form-fields/TextField";
import AddressGroup from "@/components/form-fields/AddressGroup";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface CompanyDetailsStepProps {
  form: UseFormReturn<FormData>;
}

export default function CompanyDetailsStep({ form }: CompanyDetailsStepProps) {
  return (
    <div className="space-y-5">
      <TextField form={form} name="companyName" label="Legal Company Name" />
      <Separator className="my-2" />
      <AddressGroup form={form} prefix="comp" label="Registered Office Address" />
    </div>
  );
}
