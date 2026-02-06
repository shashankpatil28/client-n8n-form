"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface PhoneFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
}

export default function PhoneField({ form, name, label }: PhoneFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">
            {label}
          </FormLabel>
          <FormControl>
            <div
              className={cn(
                "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
                fieldState.error && "border-destructive ring-destructive/20 focus-within:ring-destructive/20"
              )}
            >
              <PhoneInput
                placeholder="Enter phone"
                value={field.value}
                onChange={field.onChange}
                defaultCountry="CH"
                international
                className="flex-1 outline-none"
              />
            </div>
          </FormControl>
          <FormMessage className="text-[11px] font-medium" />
        </FormItem>
      )}
    />
  );
}
