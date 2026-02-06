"use client"

import { useWatch, type UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface LiveTotalSummaryProps {
  form: UseFormReturn<FormData>;
}

export default function LiveTotalSummary({ form }: LiveTotalSummaryProps) {
  const lessons = useWatch({ control: form.control, name: "lessons" });
  const discount = useWatch({ control: form.control, name: "discount" }) || 0;

  const grossTotal =
    lessons?.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.totalHours) || 0) * (Number(item.pricePerHour) || 0),
      0
    ) || 0;
  const netTotal = grossTotal - (grossTotal * discount) / 100;

  if (!grossTotal) return null;

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>Gross Subtotal</span>
        <span>{grossTotal.toFixed(2)} CHF</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-xs font-bold text-green-600">
          <span>Discount ({discount}%)</span>
          <span>-{((grossTotal * discount) / 100).toFixed(2)} CHF</span>
        </div>
      )}
      <div className="flex justify-between text-xl font-black text-primary pt-2 border-t border-primary/10">
        <span>Final Total</span>
        <span>{netTotal.toFixed(2)} CHF</span>
      </div>
    </div>
  );
}
