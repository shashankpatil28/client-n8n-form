import OnboardingForm from "@/components/OnboardingForm";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <main className="min-h-screen w-full bg-slate-50 flex items-start justify-center p-4 sm:p-8">
      {/* <OnboardingForm /> */}
      {/* The Toaster component is required for notifications.
          It is part of the shadcn/ui library and works with the
          useToast hook. Please ensure you have this component
          at `src/components/ui/toaster.tsx`. */}
      <OnboardingForm />
      <Toaster />
    </main>
  );
}