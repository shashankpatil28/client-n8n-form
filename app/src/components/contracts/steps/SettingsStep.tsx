"use client"

import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SelectField from "@/components/form-fields/SelectField";
import DateField from "@/components/form-fields/DateField";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface SettingsStepProps {
  form: UseFormReturn<FormData>;
}

export default function SettingsStep({ form }: SettingsStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <SelectField form={form} name="language" label="Language" items={["English", "German"]} />
        <SelectField
          form={form}
          name="source"
          label="Source"
          items={["Website", "Recommendation"]}
        />
      </div>
      <DateField form={form} name="contractDate" label="Contract Date" />
      <FormField
        control={form.control}
        name="clientType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm font-semibold text-slate-700">
              Who is this contract for?
            </FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-2 gap-3"
            >
              {["private", "business"].map((v) => (
                <label
                  key={v}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-slate-50",
                    field.value === v
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-100 bg-white"
                  )}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  <span className="font-bold capitalize">{v} Client</span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {v === "private" ? "Individual person" : "Company or Org"}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </FormItem>
        )}
      />
    </div>
  );
}
