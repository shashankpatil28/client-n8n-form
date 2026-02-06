"use client"

import { Separator } from "@/components/ui/separator";
import SelectField from "@/components/form-fields/SelectField";
import MultiSelectField from "@/components/form-fields/MultiSelectField";
import NumberField from "@/components/form-fields/NumberField";
import LessonList from "@/components/specialized/LessonList";
import LiveTotalSummary from "@/components/specialized/LiveTotalSummary";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface CourseDetailsStepProps {
  form: UseFormReturn<FormData>;
}

export default function CourseDetailsStep({ form }: CourseDetailsStepProps) {
  return (
    <div className="space-y-5">
      <SelectField
        form={form}
        name="courseLang"
        label="Language to Learn"
        items={["German", "Spanish", "English", "French"]}
      />
      <MultiSelectField
        form={form}
        name="level"
        label="Target Proficiency Levels"
        items={["A1", "A2", "B1", "B2", "C1", "C2"]}
      />
      <Separator />
      <LessonList form={form} />
      <div className="pt-4 border-t space-y-4">
        <NumberField form={form} name="discount" label="Applied Discount %" min={0} max={100} />
        <LiveTotalSummary form={form} />
      </div>
    </div>
  );
}
