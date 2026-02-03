"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface DateFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
  min?: string;
}

export default function DateField({ form, name, label, min }: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5 flex-1">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
          <FormControl>
            <Input type="date" {...field} min={min} className="h-11 rounded-xl bg-white" />
          </FormControl>
          <FormMessage className="text-[11px] font-medium" />
        </FormItem>
      )}
    />
  );
}
