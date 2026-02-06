import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UseFormReturn, FieldPath } from "react-hook-form";
import type { FormData } from "@/lib/schema";

interface Step {
  id: string;
  title: string;
  description: string;
  businessOnly?: boolean;
}

const allPossibleSteps: Step[] = [
  { id: "settings", title: "Initial Settings", description: "Language, source & client type" },
  { id: "client", title: "Client Details", description: "Personal information" },
  {
    id: "company",
    title: "Company Details",
    description: "Business name and address",
    businessOnly: true,
  },
  { id: "course", title: "Course Details", description: "Program & scheduling" },
  { id: "billing", title: "Billing & Dates", description: "Payments & validity" },
];

function getFieldsForStep(index: number, steps: Step[], values: any): FieldPath<FormData>[] {
  const id = steps[index]?.id;
  if (id === "settings") return ["language", "source", "contractDate", "clientType"];
  if (id === "client")
    return [
      "firstName",
      "lastName",
      "email",
      "phone",
      "addrStreet",
      "addrHouse",
      "addrCity",
      "addrZip",
      "addrCountry",
    ];
  if (id === "company")
    return ["companyName", "compStreet", "compHouse", "compCity", "compZip", "compCountry"];
  if (id === "course") return ["courseLang", "level", "lessons", "discount"];
  if (id === "billing") return ["courseStart", "courseEnd", "validUntil", "payments"];
  return [];
}

export function useFormSteps(form: UseFormReturn<FormData>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();

  const clientType = form.watch("clientType");
  const steps = useMemo(
    () => allPossibleSteps.filter((s) => !s.businessOnly || clientType === "business"),
    [clientType]
  );

  // Reset step index if it exceeds the number of steps
  useEffect(() => {
    if (currentStepIndex >= steps.length) setCurrentStepIndex(0);
  }, [steps, currentStepIndex]);

  const next = async () => {
    const fields = getFieldsForStep(currentStepIndex, steps, form.getValues());
    const valid = await form.trigger(fields);
    if (!valid) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please complete required fields.",
      });
      return;
    }
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex((s) => s + 1);
  };

  const prev = () => setCurrentStepIndex((s) => Math.max(0, s - 1));

  const currentStepId = steps[currentStepIndex]?.id;

  return {
    currentStepIndex,
    setCurrentStepIndex,
    steps,
    currentStepId,
    next,
    prev,
  };
}
