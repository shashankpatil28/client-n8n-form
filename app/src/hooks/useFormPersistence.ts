import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/lib/schema";

const LOCAL_STORAGE_KEY = "onboardingFormState";
const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
const CLEANUP_CHECK_INTERVAL = 60 * 1000; // Check every minute for expired data

interface SavedState<T = FormData> {
  data: T;
  step: number;
  timestamp: number;
}

/**
 * Clean up all expired form data from localStorage
 * This runs periodically to ensure stale data is removed
 */
export function cleanupExpiredFormData() {
  const formKeys = ["onboardingFormState", "invoiceFormState"];

  formKeys.forEach((key) => {
    try {
      const savedStateJSON = localStorage.getItem(key);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        const isExpired = Date.now() - savedState.timestamp > FIFTEEN_MINUTES_IN_MS;
        if (isExpired) {
          localStorage.removeItem(key);
          console.log(`Cleaned up expired form data: ${key}`);
        }
      }
    } catch (error) {
      // If parsing fails, remove the corrupted data
      localStorage.removeItem(key);
    }
  });
}

export function useFormPersistence(
  form: UseFormReturn<FormData>,
  currentStepIndex: number,
  setCurrentStepIndex: (index: number) => void
) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Set up periodic cleanup of expired data
  useEffect(() => {
    // Initial cleanup
    cleanupExpiredFormData();

    // Set up periodic cleanup
    cleanupIntervalRef.current = setInterval(() => {
      cleanupExpiredFormData();
    }, CLEANUP_CHECK_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
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

  const handleClear = useCallback(() => {
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
  }, [form, setCurrentStepIndex, toast]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    mounted,
    handleClear,
    clearStorage,
  };
}

/**
 * Generic form persistence hook that can be used for any form type
 * @param storageKey - Unique key for localStorage
 * @param form - React Hook Form instance
 * @param currentStep - Current step index
 * @param setCurrentStep - Function to set current step
 * @param defaultValues - Default form values for reset
 */
export function useGenericFormPersistence<T extends Record<string, any>>(
  storageKey: string,
  form: UseFormReturn<T>,
  currentStep: number,
  setCurrentStep: (step: number) => void,
  defaultValues: T
) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedStateJSON = localStorage.getItem(storageKey);
      if (savedStateJSON) {
        const savedState: SavedState<T> = JSON.parse(savedStateJSON);
        const isExpired = Date.now() - savedState.timestamp > FIFTEEN_MINUTES_IN_MS;

        if (!isExpired && savedState.data) {
          form.reset(savedState.data);
          setCurrentStep(savedState.step || 0);
          toast({
            title: "Progress Restored",
            description: "Your previous session was recovered.",
          });
        } else if (isExpired) {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
      localStorage.removeItem(storageKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up periodic cleanup of expired data
  useEffect(() => {
    cleanupExpiredFormData();
    cleanupIntervalRef.current = setInterval(() => {
      cleanupExpiredFormData();
    }, CLEANUP_CHECK_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // Save to localStorage on form change
  useEffect(() => {
    if (!mounted) return;

    const subscription = form.watch((value) => {
      try {
        const stateToSave: SavedState<T> = {
          data: value as T,
          step: currentStep,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, currentStep, mounted, storageKey]);

  const handleClear = useCallback(() => {
    if (
      window.confirm("Are you sure you want to clear all data and restart? This cannot be undone.")
    ) {
      localStorage.removeItem(storageKey);
      form.reset(defaultValues);
      setCurrentStep(0);
      toast({
        title: "Form Cleared",
        description: "You can now start over from scratch.",
      });
    }
  }, [form, setCurrentStep, storageKey, defaultValues, toast]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    mounted,
    handleClear,
    clearStorage,
  };
}
