"use client"

import { useMemo } from "react";
import countryList from "react-select-country-list";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TextField from "./TextField";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface AddressGroupProps {
  form: UseFormReturn<FormData>;
  prefix: string;
  label: string;
}

export default function AddressGroup({ form, prefix, label }: AddressGroupProps) {
  const options = useMemo(() => countryList().getData(), []);

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <div className="grid grid-cols-6 gap-4">
        {/* Row 1: Street, House, Apt */}
        <div className="col-span-3">
          <TextField form={form} name={`${prefix}Street`} label="Street" />
        </div>
        <div className="col-span-1">
          <TextField form={form} name={`${prefix}House`} label="No." />
        </div>
        <div className="col-span-2">
          <TextField form={form} name={`${prefix}Apt`} label="Apt (opt.)" />
        </div>

        {/* Row 2: City, State, and Zip */}
        <div className="col-span-2">
          <TextField form={form} name={`${prefix}City`} label="City" />
        </div>
        <div className="col-span-2">
          <TextField form={form} name={`${prefix}State`} label="State/Province" />
        </div>
        <div className="col-span-2">
          <TextField form={form} name={`${prefix}Zip`} label="Zip" />
        </div>

        {/* Row 3: Country */}
        <div className="col-span-6">
          <FormField
            control={form.control}
            name={`${prefix}Country` as any}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-600 uppercase">Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl bg-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((c: any) => (
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
  );
}
