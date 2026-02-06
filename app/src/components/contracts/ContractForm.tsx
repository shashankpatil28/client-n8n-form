"use client"

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type FormData } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";
import { useFormSteps } from "@/hooks/useFormSteps";
import { useFormPersistence } from "@/hooks/useFormPersistence";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/ui/step-indicator";
import ThankYouCard from "@/components/ThankYouCard";

// Step Components
import SettingsStep from "./steps/SettingsStep";
import ClientDetailsStep from "./steps/ClientDetailsStep";
import CompanyDetailsStep from "./steps/CompanyDetailsStep";
import CourseDetailsStep from "./steps/CourseDetailsStep";
import BillingStep from "./steps/BillingStep";

export default function ContractForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      addrStreet: "",
      addrHouse: "",
      addrApt: "",
      addrCity: "",
      addrZip: "",
      addrState: "",
      addrCountry: "Switzerland",
      companyName: "",
      compStreet: "",
      compHouse: "",
      compApt: "",
      compCity: "",
      compZip: "",
      compState: "",
      compCountry: "",
      program: "Private tuition",
      courseLang: "German",
      level: [],
      lessons: [{ type: "Online Lessons", format: "60", totalHours: 0, pricePerHour: 0, schedule: "" }],
      payments: [{ date: "", amount: 0 }],
      hoursPerLesson: "60",
      discount: 0,
      courseStart: new Date().toISOString().split("T")[0],
      courseEnd: "",
      validUntil: "",
    },
  });

  const { currentStepIndex, setCurrentStepIndex, steps, currentStepId, next, prev } = useFormSteps(form);
  const { mounted, handleClear, clearStorage } = useFormPersistence(form, currentStepIndex, setCurrentStepIndex);

  // Watch values for calculations
  const courseStart = form.watch("courseStart");
  const watchedLessons = useWatch({ control: form.control, name: "lessons" });
  const watchedDiscount = useWatch({ control: form.control, name: "discount" }) || 0;

  // Calculate total
  const grossTotal =
    watchedLessons?.reduce(
      (sum, item) => sum + (Number(item.totalHours) || 0) * (Number(item.pricePerHour) || 0),
      0
    ) || 0;
  const liveTotalValue = Math.round(grossTotal * (1 - watchedDiscount / 100));

  // Effect to set default end dates based on start date
  useEffect(() => {
    if (courseStart) {
      const startDate = new Date(courseStart);
      const courseEndValue = form.getValues("courseEnd");
      const validUntilValue = form.getValues("validUntil");

      // Course End Date - 1 month after start
      const defaultEndDate = new Date(startDate);
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
      const defaultEndDateString = defaultEndDate.toISOString().split("T")[0];

      if (!courseEndValue || courseEndValue < defaultEndDateString) {
        form.setValue("courseEnd", defaultEndDateString, { shouldValidate: true });
      }

      // Valid Until - 1 year after start
      const defaultValidUntilDate = new Date(startDate);
      defaultValidUntilDate.setFullYear(defaultValidUntilDate.getFullYear() + 1);
      const defaultValidUntilString = defaultValidUntilDate.toISOString().split("T")[0];

      if (!validUntilValue || validUntilValue < defaultValidUntilString) {
        form.setValue("validUntil", defaultValidUntilString, { shouldValidate: true });
      }
    }
  }, [courseStart, form]);

  // Effect to set default payment plan
  useEffect(() => {
    if (steps[currentStepIndex]?.id === "billing") {
      const payments = form.getValues("payments");
      if (liveTotalValue > 0 && payments.length === 1 && payments[0].amount === 0 && payments[0].date === "") {
        const paymentDate = new Date();
        paymentDate.setDate(paymentDate.getDate() + 7);

        form.setValue(
          "payments",
          [{ date: paymentDate.toISOString().split("T")[0], amount: liveTotalValue }],
          { shouldValidate: true }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, liveTotalValue, form]);

  // Manual submit handler - ONLY called when submit button is clicked
  const handleManualSubmit = async () => {
    // Validate all fields first
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please complete all required fields correctly.",
      });
      return;
    }

    const data = form.getValues();

    try {
      const payload = {
        body: {
          ...data,
          calculatedTotalValue: liveTotalValue,
          paymentPlanString: data.payments.map((p: any) => `${p.date}: ${p.amount} CHF`).join("; "),
          totalHours: data.lessons.reduce((sum, item) => sum + (item.totalHours || 0), 0),
          scheduleText: data.lessons.map((l) => `${l.type} (${l.totalHours}h): ${l.schedule}`).join("\n"),
          level: Array.isArray(data.level) ? data.level.join(", ") : data.level,
        },
      };

      console.log("Submitting contract to API...", payload);

      // Use Next.js API route proxy instead of direct n8n webhook call
      const res = await fetch("/api/submit-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Submission failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || "Submission failed";
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Server error (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      toast({ title: "Success! 🚀", description: `Contract generated. Total: ${liveTotalValue} CHF` });
      clearStorage();
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Contract submission error:", error);

      // Provide helpful error messages
      let errorTitle = "Submission Error";
      let errorDescription = error.message || "Could not submit form. Please try again.";

      if (error.message?.includes('workflow is not active')) {
        errorTitle = "n8n Workflow Inactive";
        errorDescription = "The n8n workflow is not active. Please activate it in your n8n dashboard and try again.";
      } else if (error.message?.includes('blocked by firewall')) {
        errorTitle = "Network Error";
        errorDescription = "Webhook is blocked by firewall/proxy. Please check your network settings or contact IT support.";
      } else if (error.message?.includes('webhook not found')) {
        errorTitle = "Configuration Error";
        errorDescription = "Webhook URL is not configured correctly. Please check your environment variables.";
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription,
      });
    }
  };

  if (!mounted) return null;

  if (isSubmitted) {
    return <ThankYouCard />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <StepIndicator steps={steps} currentStepIndex={currentStepIndex} />

      <Card className="shadow-lg border-2 border-slate-100">
        <CardHeader className="border-b p-6">
          <CardTitle className="text-2xl font-bold">
            {steps[currentStepIndex]?.title || "Contract Onboarding"}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            {steps[currentStepIndex]?.description}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              // Prevent default form submission completely
              e.preventDefault();
              console.log("Form submit event prevented");
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form
              // Allow Enter in textareas and on buttons only
              if (
                e.key === 'Enter' &&
                e.target instanceof HTMLElement &&
                e.target.tagName !== 'TEXTAREA' &&
                e.target.tagName !== 'BUTTON'
              ) {
                e.preventDefault();
              }
            }}
          >
            <CardContent className="p-6 min-h-[450px]">
              <div className="space-y-6">
                {currentStepId === "settings" && <SettingsStep form={form} />}
                {currentStepId === "client" && <ClientDetailsStep form={form} />}
                {currentStepId === "company" && <CompanyDetailsStep form={form} />}
                {currentStepId === "course" && <CourseDetailsStep form={form} />}
                {currentStepId === "billing" && <BillingStep form={form} liveTotalValue={liveTotalValue} />}
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 p-6 border-t flex items-center gap-3">
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" onClick={prev} className="h-12 font-bold shadow-sm">
                  Back
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-destructive hover:text-destructive h-12"
              >
                Clear All
              </Button>
              {currentStepIndex < steps.length - 1 ? (
                <Button type="button" onClick={next} className="h-12 px-8 font-bold shadow-md">
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleManualSubmit}
                  className="h-12 px-8 font-bold shadow-md bg-green-600 hover:bg-green-700"
                >
                  Submit Contract
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
