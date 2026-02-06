"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface NumberFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
  min?: number;
  max?: number;
}

export default function NumberField({ form, name, label, min, max }: NumberFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              max={max}
              className="h-11 rounded-xl bg-white"
              {...field}
              onChange={(e) => {
                let val = e.target.value === "" ? 0 : Number(e.target.value);
                if (max !== undefined) val = Math.min(val, max);
                if (min !== undefined) val = Math.max(val, min);
                field.onChange(val);
              }}
            />
          </FormControl>
          <FormMessage className="text-[11px] font-medium" />
        </FormItem>
      )}
    />
  );
}
