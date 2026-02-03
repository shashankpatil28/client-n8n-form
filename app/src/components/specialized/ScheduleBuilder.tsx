"use client"

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseSingleScheduleSlot, checkOverlappingSlots } from "@/lib/schema";
import type { UseFormReturn, FieldPath } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface ScheduleBuilderProps {
  form: UseFormReturn<FormData>;
  index: number;
}

export default function ScheduleBuilder({ form, index }: ScheduleBuilderProps) {
  const { toast, dismiss } = useToast();
  const [day, setDay] = useState("Monday");

  // Split startTime into separate states for better control
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");

  const fieldName: FieldPath<FormData> = `lessons.${index}.schedule`;
  const { format: lessonFormat, totalHours } = form.watch(`lessons.${index}`);
  const currentSchedule = form.watch(fieldName) || "";
  const fieldError = form.formState.errors.lessons?.[index]?.schedule?.message as string | undefined;

  // Combine hours and minutes for logic
  const startTime = `${startHour}:${startMinute}`;

  const endTime = useMemo(() => {
    if (!startTime) return "";
    try {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const duration = parseInt(lessonFormat);
      startDate.setMinutes(startDate.getMinutes() + duration);

      const endHours = startDate.getHours().toString().padStart(2, "0");
      const endMinutes = startDate.getMinutes().toString().padStart(2, "0");
      return `${endHours}:${endMinutes}`;
    } catch {
      return "";
    }
  }, [startTime, lessonFormat]);

  const slots = useMemo(
    () =>
      currentSchedule
        ? currentSchedule
            .split(", ")
            .filter(Boolean)
            .map((s: string) => {
              const [d, t] = s.split(" ");
              return { day: d, time: t };
            })
        : [],
    [currentSchedule]
  );

  const addSlot = () => {
    form.clearErrors(fieldName);

    const newSlotString = `${day} ${startTime}-${endTime}`;

    // Client-side pre-validation for the new slot format
    const parsedNewSlot = parseSingleScheduleSlot(newSlotString);
    if (!parsedNewSlot) {
      form.setError(fieldName, {
        type: "manual",
        message: `Invalid schedule format: "${newSlotString}". Expected "Day HH:MM-HH:MM".`,
      });
      return;
    }

    // Get all existing slots and parse them
    const existingSlotStrings = currentSchedule.split(", ").filter(Boolean);
    const parsedExistingSlots = existingSlotStrings
      .map((s) => parseSingleScheduleSlot(s))
      .filter(Boolean) as NonNullable<ReturnType<typeof parseSingleScheduleSlot>>[];

    // Validation: Ensure lesson duration doesn't exceed remaining contract time.
    const totalContractMinutes = (Number(totalHours) || 0) * 60;
    if (totalContractMinutes > 0) {
      const scheduledMinutes = parsedExistingSlots.reduce((sum, slot) => {
        const durationMs = slot.endDate.getTime() - slot.startDate.getTime();
        return sum + durationMs / (1000 * 60);
      }, 0);

      const lessonDurationMinutes = parseInt(lessonFormat);
      const remainingMinutes = totalContractMinutes - scheduledMinutes;

      if (lessonDurationMinutes > remainingMinutes) {
        form.setError(fieldName, {
          type: "manual",
          message: `Cannot add a ${lessonDurationMinutes} min lesson. Only ${Math.round(
            remainingMinutes
          )} min remaining in the contract.`,
        });
        return;
      }
    }

    // Combine existing and new slot for overlap check
    const allSlotsForCheck = [...parsedExistingSlots, parsedNewSlot];

    // Check for overlaps
    const overlapError = checkOverlappingSlots(allSlotsForCheck);

    if (overlapError) {
      // Dismiss any existing toast to ensure the new one's animation triggers.
      dismiss();
      // Use a short timeout to allow the dismiss action to process before showing the new toast.
      setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Schedule Conflict",
          description: overlapError,
        });
      }, 100);
      return;
    }

    const newSchedule = currentSchedule ? `${currentSchedule}, ${newSlotString}` : newSlotString;
    form.setValue(fieldName, newSchedule, { shouldValidate: true });
  };

  const removeSlot = (slotIndex: number) => {
    const newSchedule = slots
      .filter((_, i) => i !== slotIndex)
      .map((s) => `${s.day} ${s.time}`)
      .join(", ");
    form.setValue(fieldName, newSchedule, { shouldValidate: true });
  };

  // Generate arrays for the selects
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
        Proposed Schedule
      </label>
      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
        {slots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {slots.map((s, i) => (
              <div
                key={i}
                className="text-xs bg-primary/10 text-primary-800 px-2.5 py-1.5 rounded-full font-bold border border-primary/20 flex items-center gap-2"
              >
                <span>
                  {s.day.slice(0, 3)} {s.time}
                </span>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-primary/60 hover:text-destructive font-mono text-lg leading-none -mr-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg text-center border border-dashed">
            No schedule slots added.
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          {/* Day Selection */}
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-10 rounded-lg border-slate-200 bg-slate-50 px-2 text-sm flex-[1.5] shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
              (d) => (
                <option key={d}>{d}</option>
              )
            )}
          </select>

          {/* Hour Selection */}
          <div className="flex items-center gap-1 flex-1">
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 px-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="font-bold text-slate-400">:</span>
            {/* Minute Selection - Restricted to 00, 15, 30, 45 */}
            <select
              value={startMinute}
              onChange={(e) => setStartMinute(e.target.value)}
              className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 px-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Calculated End Time Display */}
          <div className="flex flex-col flex-1">
            <div className="h-10 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-600">
              end : {endTime}
            </div>
          </div>

          <Button type="button" size="sm" onClick={addSlot} className="h-10 px-4 font-bold">
            Add
          </Button>
        </div>
      </div>
      {fieldError && <p className="text-[11px] font-medium text-destructive px-1">{fieldError}</p>}
    </div>
  );
}
