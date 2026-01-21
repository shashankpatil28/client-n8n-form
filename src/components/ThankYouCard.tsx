import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function ThankYouCard() {
  return (
    <Card className="w-full max-w-xl mx-auto my-10 rounded-2xl shadow-lg border border-slate-200 bg-white overflow-hidden">
      
      {/* Header */}
      <CardHeader className="bg-slate-50/60 border-b text-center space-y-3 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
        </div>

        <CardTitle className="text-3xl font-extrabold text-slate-900">
          Contract Submitted Successfully
        </CardTitle>

        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your information has been securely sent and the contract generation
          workflow has been triggered.
        </p>
      </CardHeader>

      {/* Body */}
      <CardContent className="py-10 px-8 space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-700">
            What happens next?
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our system is now preparing the contract document.  
            You will receive the finalized contract shortly via email or your
            configured delivery channel.
          </p>
        </div>

        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-sm text-slate-600">
          You may safely close this page. No further action is required.
        </div>

        {/* Optional Actions */}
        <div className="flex justify-center gap-3 pt-4">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => window.location.reload()}
          >
            Create Another Contract
          </Button>

          <Button
            className="rounded-xl font-bold"
            onClick={() => window.location.href = "/"}
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
