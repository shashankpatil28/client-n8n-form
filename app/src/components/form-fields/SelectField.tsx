"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface SelectFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
  items: string[];
}

export default function SelectField({ form, name, label, items }: SelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5 flex-1">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-11 rounded-xl bg-white">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {items.map((i: string) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-[11px] font-medium" />
        </FormItem>
      )}
    />
  );
}
