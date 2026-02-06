"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface TextFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
  type?: string;
}

export default function TextField({ form, name, label, type = "text" }: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              className="h-11 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20"
            />
          </FormControl>
          <FormMessage className="text-[11px] font-medium" />
        </FormItem>
      )}
    />
  );
}
