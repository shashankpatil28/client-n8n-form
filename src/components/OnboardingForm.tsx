"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css"; // Ensure styles are imported
import countryList from "react-select-country-list";

import { formSchema, type FormData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray, useWatch, type FieldPath, type UseFormReturn } from "react-hook-form";
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const allPossibleSteps = [
  { id: 'settings', title: "Initial Settings", description: "Language, source & client type" },
  { id: 'client', title: "Client Details", description: "Personal information" },
  { id: 'company', title: "Company Details", description: "Business name and address", businessOnly: true },
  { id: 'course', title: "Course Details", description: "Program & scheduling" },
  { id: 'billing', title: "Billing & Dates", description: "Payments & validity" },
];

const LOCAL_STORAGE_KEY = "onboardingFormState";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export default function OnboardingForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    mode: "onChange",
    defaultValues: {
      language: "English",
      source: "Website",
      contractDate: new Date().toISOString().split("T")[0],
      clientType: "private",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addrStreet: "", addrHouse: "", addrApt: "", addrCity: "", addrZip: "", addrState: "", addrCountry: "Switzerland",
      companyName: "", compStreet: "", compHouse: "", compApt: "", compCity: "", compZip: "", compState: "", compCountry: "",
      program: "Private tuition",
      courseLang: "German",
      level: [],
      lessons: [{ type: "Online Lessons", format: "60", totalHours: 0, pricePerHour: 0, schedule: "" }],
      payments: [{ date: "", amount: 0 }],
      hoursPerLesson: "60",
      discount: 0,
      courseStart: "",
      courseEnd: "",
      validUntil: "",
    },
  });

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        const isExpired = Date.now() - savedState.timestamp > ONE_DAY_IN_MS;

        if (!isExpired && savedState.data) {
          form.reset(savedState.data);
          setCurrentStepIndex(savedState.step || 0);
          toast({
            title: "Progress Restored",
            description: "We've loaded your previously saved form data.",
          });
        } else if (isExpired) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load form state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedValues = useWatch({ control: form.control });

  // Save to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    const stateToSave = { timestamp: Date.now(), data: watchedValues, step: currentStepIndex };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [watchedValues, currentStepIndex, mounted]);

  const clientType = form.watch("clientType");
  const steps = useMemo(() => allPossibleSteps.filter(s => !s.businessOnly || clientType === 'business'), [clientType]);

  useEffect(() => {
    if (currentStepIndex >= steps.length) setCurrentStepIndex(0);
  }, [steps, currentStepIndex]);

  const watchedLessons = useWatch({ control: form.control, name: "lessons" });
  const watchedDiscount = useWatch({ control: form.control, name: "discount" }) || 0;
  
  const grossTotal = watchedLessons?.reduce((sum, item) => sum + ((Number(item.totalHours) || 0) * (Number(item.pricePerHour) || 0)), 0) || 0;
  const liveTotalValue = Math.round(grossTotal * (1 - (watchedDiscount / 100)));

  const next = async () => {
    const fields = getFieldsForStep(currentStepIndex, steps, form.getValues());
    const valid = await form.trigger(fields);
    if (!valid) {
      toast({ variant: "destructive", title: "Missing information", description: "Please complete required fields." });
      return;
    }
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex((s) => s + 1);
  };

  const prev = () => setCurrentStepIndex((s) => Math.max(0, s - 1));

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all data and restart? This cannot be undone.")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      form.reset(); // Resets to defaultValues
      setCurrentStepIndex(0);
      toast({
        title: "Form Cleared",
        description: "You can now start over from scratch.",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) return toast({ title: "Error", description: "Missing Webhook URL." });

      const payload = {
        body: {
          ...data,
          calculatedTotalValue: liveTotalValue,
          paymentPlanString: data.payments.map((p: any) => `${p.date}: ${p.amount} CHF`).join("; "),
          totalHours: data.lessons.reduce((sum, item) => sum + (item.totalHours || 0), 0),
          scheduleText: data.lessons.map(l => `${l.type} (${l.totalHours}h): ${l.schedule}`).join("\n"),
          level: Array.isArray(data.level) ? data.level.join(", ") : data.level,
        }
      };

      const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast({ title: "Success! 🚀", description: `Contract generated. Total: ${liveTotalValue} CHF` });
    } catch (error) {
      toast({ variant: "destructive", title: "Submission failed", description: "Could not reach n8n." });
    }
  };

  if (!mounted) return null;
  const currentStepId = steps[currentStepIndex]?.id;

  return (
    <Card className="w-full max-w-xl mx-auto rounded-2xl shadow-lg border border-slate-200 bg-white my-8 overflow-hidden">
      <CardHeader className="pb-6 space-y-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((_, index) => (
            <div key={index} className={cn("h-1.5 rounded-full flex-1 transition-all duration-500", currentStepIndex >= index ? 'bg-primary' : 'bg-slate-200')} />
          ))}
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-slate-900">{steps[currentStepIndex].title}</CardTitle>
          <CardDescription className="text-slate-500 mt-1">{steps[currentStepIndex].description}</CardDescription>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 min-h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {currentStepId === 'settings' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <SelectField form={form} name="language" label="Language" items={["English", "German"]} />
                      <SelectField form={form} name="source" label="Source" items={["Website", "Recommendation"]} />
                    </div>
                    <DateField form={form} name="contractDate" label="Contract Date" />
                    <FormField
                      control={form.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-semibold text-slate-700">Who is this contract for?</FormLabel>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3">
                            {["private", "business"].map((v) => (
                              <label key={v} className={cn(
                                "flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-slate-50",
                                field.value === v ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-100 bg-white"
                              )}>
                                <RadioGroupItem value={v} className="sr-only" />
                                <span className="font-bold capitalize">{v} Client</span>
                                <span className="text-[10px] text-slate-500 mt-1">{v === 'private' ? 'Individual person' : 'Company or Org'}</span>
                              </label>
                            ))}
                          </RadioGroup>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStepId === 'client' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <TextField form={form} name="firstName" label="First Name" />
                      <TextField form={form} name="lastName" label="Last Name" />
                    </div>
                    <TextField form={form} name="email" label="Email Address" type="email" />
                    <PhoneField form={form} name="phone" label="Phone Number" />
                    <Separator className="my-2" />
                    <AddressGroup form={form} prefix="addr" label="Residential Address" />
                  </div>
                )}

                {currentStepId === 'company' && (
                  <div className="space-y-5">
                    <TextField form={form} name="companyName" label="Legal Company Name" />
                    <Separator className="my-2" />
                    <AddressGroup form={form} prefix="comp" label="Registered Office Address" />
                  </div>
                )}

                {currentStepId === 'course' && (
                  <div className="space-y-6">
                    <SelectField form={form} name="courseLang" label="Language to Learn" items={["German", "Spanish", "English", "French"]} />
                    <MultiSelectField form={form} name="level" label="Target Proficiency Levels" items={["A1", "A2", "B1", "B2", "C1", "C2"]} />
                    <Separator />
                    <LessonList form={form} />
                    <div className="pt-4 border-t space-y-4">
                      <NumberField form={form} name="discount" label="Applied Discount %" min={0} max={100} />
                      <LiveTotalSummary form={form} />
                    </div>
                  </div>
                )}

                {currentStepId === 'billing' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <DateField form={form} name="courseStart" label="Start Date" />
                      <DateField form={form} name="courseEnd" label="End Date" />
                    </div>
                    <DateField form={form} name="validUntil" label="Offer Valid Until" />
                    <Separator />
                    <PaymentBuilder form={form} calculatedTotal={liveTotalValue} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 border-t flex items-center gap-3">
            {currentStepIndex > 0 && (
              <Button type="button" variant="outline" onClick={prev} className="h-12 font-bold shadow-sm">
                Back
              </Button>
            )}
            <Button 
              type="button" 
              className="flex-grow h-12 font-bold shadow-md transition-all active:scale-95" 
              onClick={
                currentStepIndex === steps.length - 1 
                  ? form.handleSubmit(onSubmit, (errors) => {
                      console.error("🚨 VALIDATION FAILED:", errors);
                      toast({ 
                        variant: "destructive", 
                        title: "Validation Error", 
                        description: "Please check the form for errors. Invalid fields are highlighted." 
                      });
                    }) 
                  : next
              }
            >
              {currentStepIndex === steps.length - 1 ? "Complete & Send Contract" : "Continue"}
            </Button>
            {currentStepIndex > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:bg-destructive/10">
                Clear & Restart
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

/* ------------------ REFACTORED HELPERS ------------------ */

function TextField({ form, name, label, type = "text" }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</FormLabel>
        <FormControl>
          <Input {...field} type={type} className="h-11 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20" />
        </FormControl>
        <FormMessage className="text-[11px] font-medium" />
      </FormItem>
    )} />
  );
}

function PhoneField({ form, name, label }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field, fieldState }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</FormLabel>
        <FormControl>
          <div className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
            fieldState.error && "border-destructive ring-destructive/20 focus-within:ring-destructive/20"
          )}>
            <PhoneInput placeholder="Enter phone" value={field.value} onChange={field.onChange} defaultCountry="CH" international className="flex-1 outline-none" />
          </div>
        </FormControl>
        {fieldState.error && <p className="text-[11px] font-medium text-destructive">{fieldState.error.message}</p>}
      </FormItem>
    )} />
  );
}

function AddressGroup({ form, prefix, label }: any) {
  const options = useMemo(() => countryList().getData(), []);
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <div className="grid grid-cols-6 gap-3">
        {/* Row 1: Street, House, Apt */}
        <div className="col-span-3"><TextField form={form} name={`${prefix}Street`} label="Street" /></div>
        <div className="col-span-1"><TextField form={form} name={`${prefix}House`} label="No." /></div>
        <div className="col-span-2"><TextField form={form} name={`${prefix}Apt`} label="Apt (opt.)" /></div>
        
        {/* Row 2: City, State, and Zip */}
        <div className="col-span-2"><TextField form={form} name={`${prefix}City`} label="City" /></div>
        <div className="col-span-2"><TextField form={form} name={`${prefix}State`} label="State/Province" /></div>
        <div className="col-span-2"><TextField form={form} name={`${prefix}Zip`} label="Zip" /></div>
        
        {/* Row 3: Country */}
        <div className="col-span-6">
          <FormField control={form.control} name={`${prefix}Country`} render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-bold text-slate-600 uppercase">Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                <SelectContent>{options.map((c: any) => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}

function MultiSelectField({ form, name, label, items }: any) {
  return (
    <FormField control={form.control} name={name} render={() => (
      <FormItem className="space-y-3">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
        <div className="grid grid-cols-3 gap-3"> 
          {items.map((item: string) => (
            <FormField key={item} control={form.control} name={name} render={({ field }) => (
              <label className={cn(
                "flex items-center space-x-3 rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-50",
                (field.value as string[])?.includes(item) ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100"
              )}>
                <FormControl>
                  <Checkbox checked={(field.value as string[])?.includes(item)} onCheckedChange={(checked) => {
                    const current = (field.value as string[]) || [];
                    return checked ? field.onChange([...current, item]) : field.onChange(current.filter(v => v !== item));
                  }} />
                </FormControl>
                <span className="text-sm font-medium">{item}</span>
              </label>
            )} />
          ))}
        </div>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function SelectField({ form, name, label, items }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-1.5 flex-1">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl><SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
          <SelectContent>{items.map((i: string) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
      </FormItem>
    )} />
  );
}

function DateField({ form, name, label }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-1.5 flex-1">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
        <FormControl><Input type="date" {...field} className="h-11 rounded-xl bg-white" /></FormControl>
      </FormItem>
    )} />
  );
}

function NumberField({ form, name, label, min, max }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="text-xs font-bold text-slate-600 uppercase">{label}</FormLabel>
        <FormControl>
          <Input type="number" min={min} max={max} className="h-11 rounded-xl bg-white" {...field} onChange={(e) => {
            let val = e.target.value === "" ? 0 : Number(e.target.value);
            if (max !== undefined) val = Math.min(val, max);
            if (min !== undefined) val = Math.max(val, min);
            field.onChange(val);
          }} />
        </FormControl>
      </FormItem>
    )} />
  );
}

/* ------------------ LESSONS COMPONENT ------------------ */

function LessonList({ form }: { form: UseFormReturn<FormData> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lessons" });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Lesson Packages</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ type: "Online Lessons", format: "60", totalHours: 0, pricePerHour: 0, schedule: "" })} className="rounded-full h-8">+ Add Type</Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 relative">
          {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-colors">×</button>}
          <div className="grid grid-cols-2 gap-4">
            <SelectField form={form} name={`lessons.${index}.type`} label="Type" items={["Online Lessons", "Live Lessons"]} />
            <SelectField form={form} name={`lessons.${index}.format`} label="Format (Min)" items={["45", "60", "90", "120"]} />
            <NumberField form={form} name={`lessons.${index}.totalHours`} label="Total Hours" />
            <NumberField form={form} name={`lessons.${index}.pricePerHour`} label="Price (CHF/h)" />
          </div>
          <ScheduleBuilder form={form} index={index} />
        </div>
      ))}
    </div>
  );
}

function ScheduleBuilder({ form, index }: { form: UseFormReturn<FormData>, index: number }) {
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const fieldName: FieldPath<FormData> = `lessons.${index}.schedule`;
  const currentSchedule = form.watch(fieldName) || "";
  const fieldError = form.formState.errors.lessons?.[index]?.schedule?.message as string | undefined;

  const slots = useMemo(() => currentSchedule ? currentSchedule.split(", ").filter(Boolean).map((s: string) => {
    const [d, t] = s.split(" ");
    return { day: d, time: t };
  }) : [], [currentSchedule]);

  const addSlot = () => {
    setLocalError(null);
    if (!startTime || !endTime) return; // Should be disabled anyway
    if (startTime >= endTime) {
      setLocalError("End time must be after start time.");
      return;
    }
    
    const newSlot = `${day} ${startTime}-${endTime}`;
    const newSchedule = currentSchedule ? `${currentSchedule}, ${newSlot}` : newSlot;
    form.setValue(fieldName, newSchedule, { shouldValidate: true });
    setStartTime("");
    setEndTime("");
  };

  const removeSlot = (slotIndex: number) => {
    const newSchedule = slots.filter((_, i) => i !== slotIndex).map(s => `${s.day} ${s.time}`).join(", ");
    form.setValue(fieldName, newSchedule, { shouldValidate: true });
  };

  const canAdd = startTime && endTime && startTime < endTime;

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Proposed Schedule</label>
      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
        {slots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {slots.map((s, i) => (
              <div key={i} className="text-xs bg-primary/10 text-primary-800 px-2.5 py-1.5 rounded-full font-bold border border-primary/20 flex items-center gap-2">
                <span>{s.day.slice(0,3)} {s.time}</span>
                <button type="button" onClick={() => removeSlot(i)} className="text-primary/60 hover:text-destructive font-mono text-lg leading-none -mr-1">×</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg text-center border border-dashed">
            No schedule slots added. Use the controls below to build the weekly schedule.
          </div>
        )}
        <div className="flex gap-2 items-end pt-2 border-t border-slate-100">
          <select value={day} onChange={e => setDay(e.target.value)} className="h-10 rounded-lg border-slate-200 bg-slate-50 px-2 text-sm flex-1 shadow-sm">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => <option key={d}>{d}</option>)}
          </select>
          <Input placeholder="Start" type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setLocalError(null); }} className={cn("h-10 w-24 text-sm", localError && "border-destructive")} />
          <Input placeholder="End" type="time" value={endTime} onChange={e => { setEndTime(e.target.value); setLocalError(null); }} className={cn("h-10 w-24 text-sm", localError && "border-destructive")} />
          <Button type="button" size="sm" onClick={addSlot} disabled={!canAdd} className="h-10 px-4 font-bold">Add</Button>
        </div>
      </div>
      {(localError || fieldError) && <p className="text-[11px] font-medium text-destructive px-1">{localError || fieldError}</p>}
    </div>
  );
}

function LiveTotalSummary({ form }: any) {
  const lessons = useWatch({ control: form.control, name: "lessons" });
  const discount = useWatch({ control: form.control, name: "discount" }) || 0;
  const grossTotal = lessons?.reduce((sum: number, item: any) => sum + ((Number(item.totalHours)||0) * (Number(item.pricePerHour)||0)), 0) || 0;
  const netTotal = grossTotal - (grossTotal * discount / 100);

  if (!grossTotal) return null;
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
      <div className="flex justify-between text-xs font-medium text-slate-500"><span>Gross Subtotal</span><span>{grossTotal.toFixed(2)} CHF</span></div>
      {discount > 0 && <div className="flex justify-between text-xs font-bold text-green-600"><span>Discount ({discount}%)</span><span>-{ (grossTotal * discount / 100).toFixed(2) } CHF</span></div>}
      <div className="flex justify-between text-xl font-black text-primary pt-2 border-t border-primary/10"><span>Final Total</span><span>{netTotal.toFixed(2)} CHF</span></div>
    </div>
  );
}

function PaymentBuilder({ form, calculatedTotal }: any) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "payments" });
  const watched = useWatch({ control: form.control, name: "payments" }) || [];
  const currentSum = watched.reduce((sum: number, item: any) => sum + (Number(item?.amount) || 0), 0);
  const diff = calculatedTotal - currentSum;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800 uppercase">Payment Plan</h4>
        <div className={cn("text-xs font-bold px-2 py-1 rounded", Math.abs(diff) < 1 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
          Remaining: {diff.toFixed(2)} CHF
        </div>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-end bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <DateField form={form} name={`payments.${index}.date`} label={`Installment #${index+1}`} />
          <div className="w-32"><NumberField form={form} name={`payments.${index}.amount`} label="Amount" /></div>
          {fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-11 text-destructive" onClick={() => remove(index)}>✕</Button>}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ date: "", amount: 0 })} className="w-full border-dashed rounded-xl h-11">+ Add Next Installment</Button>
    </div>
  );
}

function getFieldsForStep(index: number, steps: any[], values: any): FieldPath<FormData>[] {
  const id = steps[index]?.id;
  if (id === 'settings') return ["language", "source", "contractDate", "clientType"];
  if (id === 'client') return ["firstName", "lastName", "email", "phone", "addrStreet", "addrHouse", "addrCity", "addrZip", "addrCountry"];
  if (id === 'company') return ["companyName", "compStreet", "compHouse", "compCity", "compZip", "compCountry"];
  if (id === 'course') return ["courseLang", "level", "lessons", "discount"];
  if (id === 'billing') return ["courseStart", "courseEnd", "validUntil", "payments"];
  return [];
}