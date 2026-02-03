"use client"

import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import DateField from "@/components/form-fields/DateField";
import PaymentBuilder from "@/components/specialized/PaymentBuilder";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface BillingStepProps {
  form: UseFormReturn<FormData>;
  liveTotalValue: number;
}

export default function BillingStep({ form, liveTotalValue }: BillingStepProps) {
  const courseStart = form.watch("courseStart");
  const watchedCourseEnd = form.watch("courseEnd");

  const minEndDate = useMemo(() => {
    if (!courseStart) return undefined;
    const date = new Date(courseStart);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  }, [courseStart]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <DateField form={form} name="courseStart" label="Start Date" />
        <DateField form={form} name="courseEnd" label="End Date" min={minEndDate} />
      </div>
      <DateField form={form} name="validUntil" label="Offer Valid Until" min={watchedCourseEnd} />
      <Separator />
      <PaymentBuilder form={form} calculatedTotal={liveTotalValue} />
    </div>
  );
}
