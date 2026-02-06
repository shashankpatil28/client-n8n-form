"use client"

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/form-fields/SelectField";
import NumberField from "@/components/form-fields/NumberField";
import ScheduleBuilder from "./ScheduleBuilder";
import type { FormData } from "@/lib/schema";

interface LessonListProps {
  form: UseFormReturn<FormData>;
}

export default function LessonList({ form }: LessonListProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lessons" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Lesson Packages
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              type: "Online Lessons",
              format: "60",
              totalHours: 0,
              pricePerHour: 0,
              schedule: "",
            })
          }
          className="rounded-full h-8"
        >
          + Add Type
        </Button>
      </div>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 relative"
        >
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              ×
            </button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              form={form}
              name={`lessons.${index}.type`}
              label="Type"
              items={["Online Lessons", "Live Lessons"]}
            />
            <SelectField
              form={form}
              name={`lessons.${index}.format`}
              label="Format (Min)"
              items={["45", "60", "90", "120"]}
            />
            <NumberField form={form} name={`lessons.${index}.totalHours`} label="Total Hours" />
            <NumberField form={form} name={`lessons.${index}.pricePerHour`} label="Price (CHF/h)" />
          </div>
          <ScheduleBuilder form={form} index={index} />
        </div>
      ))}
    </div>
  );
}
