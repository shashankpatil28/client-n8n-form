import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

const LOCAL_STORAGE_KEY = "onboardingFormState";
const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

interface SavedState {
  data: FormData;
  step: number;
  timestamp: number;
}

export function useFormPersistence(
  form: UseFormReturn<FormData>,
  currentStepIndex: number,
  setCurrentStepIndex: (index: number) => void
) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState: SavedState = JSON.parse(savedStateJSON);
        const isExpired = Date.now() - savedState.timestamp > FIFTEEN_MINUTES_IN_MS;

        if (!isExpired && savedState.data) {
          form.reset(savedState.data);
          setCurrentStepIndex(savedState.step || 0);
          toast({
            title: "Progress Restored",
            description: "Your previous session was recovered.",
          });
        } else if (isExpired) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on form change
  useEffect(() => {
    if (!mounted) return;

    const subscription = form.watch((value) => {
      try {
        const stateToSave: SavedState = {
          data: value as FormData,
          step: currentStepIndex,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, currentStepIndex, mounted]);

  const handleClear = () => {
    if (
      window.confirm("Are you sure you want to clear all data and restart? This cannot be undone.")
    ) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      form.reset();
      setCurrentStepIndex(0);
      toast({
        title: "Form Cleared",
        description: "You can now start over from scratch.",
      });
    }
  };

  const clearStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return {
    mounted,
    handleClear,
    clearStorage,
  };
}
