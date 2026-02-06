"use client"

import { Separator } from "@/components/ui/separator";
import TextField from "@/components/form-fields/TextField";
import PhoneField from "@/components/form-fields/PhoneField";
import AddressGroup from "@/components/form-fields/AddressGroup";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface ClientDetailsStepProps {
  form: UseFormReturn<FormData>;
}

export default function ClientDetailsStep({ form }: ClientDetailsStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="firstName" label="First Name" />
        <TextField form={form} name="lastName" label="Last Name" />
      </div>
      <TextField form={form} name="email" label="Email Address" type="email" />
      <PhoneField form={form} name="phone" label="Phone Number" />
      <Separator className="my-2" />
      <AddressGroup form={form} prefix="addr" label="Residential Address" />
    </div>
  );
}
