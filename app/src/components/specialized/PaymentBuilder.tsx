"use client"

import { useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import DateField from "@/components/form-fields/DateField";
import { cn } from "@/lib/utils";
import type { FormData } from "@/lib/schema";

interface PaymentBuilderProps {
  form: UseFormReturn<FormData>;
  calculatedTotal: number;
}

export default function PaymentBuilder({ form, calculatedTotal }: PaymentBuilderProps) {
  const [activePaymentIndex, setActivePaymentIndex] = useState<number | null>(null);
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "payments" });
  const watched = useWatch({ control: form.control, name: "payments" }) || [];
  const currentSum = watched.reduce(
    (sum: number, item: any) => sum + (Number(item?.amount) || 0),
    0
  );
  const diff = calculatedTotal - currentSum;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800 uppercase">Payment Plan</h4>
        <div
          className={cn(
            "text-xs font-bold px-2 py-1 rounded",
            Math.abs(diff) < 1 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          )}
        >
          Remaining: {diff.toFixed(2)} CHF
        </div>
      </div>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className={cn(
            "flex gap-2 items-end bg-white p-3 rounded-xl border border-slate-100 shadow-sm",
            form.formState.errors.payments?.[index]?.amount && "border-destructive"
          )}
        >
          <DateField form={form} name={`payments.${index}.date`} label={`Installment #${index + 1}`} />
          <div className="w-32">
            <FormField
              control={form.control}
              name={`payments.${index}.amount`}
              render={({ field: amountField }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-slate-600 uppercase">Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={index === 0 ? calculatedTotal.toFixed(2) : "0.00"}
                      {...amountField}
                      onFocus={() => setActivePaymentIndex(index)}
                      onBlur={() => {
                        amountField.onBlur();
                        setActivePaymentIndex(null);
                        form.trigger(`payments.0.amount`);
                      }}
                      onChange={(e) => {
                        amountField.onChange(e.target.value);
                        form.trigger(`payments.0.amount`);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 text-destructive"
              onClick={() => remove(index)}
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ date: "", amount: 0 })}
        className="w-full border-dashed rounded-xl h-11"
      >
        + Add Next Installment
      </Button>
    </div>
  );
}
