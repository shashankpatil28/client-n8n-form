"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface MultiSelectFieldProps {
  form: UseFormReturn<FormData>;
  name: any;
  label: string;
  items: string[];
}

export default function MultiSelectField({ form, name, label, items }: MultiSelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className="space-y-3">
          <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
          <div className="grid grid-cols-3 gap-3">
            {items.map((item: string) => (
              <FormField
                key={item}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <label
                    className={cn(
                      "flex items-center space-x-3 rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-50",
                      (field.value as string[])?.includes(item)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-100"
                    )}
                  >
                    <FormControl>
                      <Checkbox
                        checked={(field.value as string[])?.includes(item)}
                        onCheckedChange={(checked) => {
                          const current = (field.value as string[]) || [];
                          return checked
                            ? field.onChange([...current, item])
                            : field.onChange(current.filter((v) => v !== item));
                        }}
                      />
                    </FormControl>
                    <span className="text-sm font-medium">{item}</span>
                  </label>
                )}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
