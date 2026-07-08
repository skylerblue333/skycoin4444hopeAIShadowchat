import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MFAChallengeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
}

export function MFAChallenge({ onSuccess, onCancel, open = true }: MFAChallengeProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const verifyMfaMutation = trpc.mfa.verifyMfa.useMutation();
  const useRecoveryCodeMutation = trpc.mfa.useRecoveryCode.useMutation();

  const handleVerifyTOTP = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setError("");
    try {
      const result = await verifyMfaMutation.mutateAsync({
        token: code,
        secret: "", // The secret is stored server-side
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify MFA code");
    }
  };

  const handleUseRecoveryCode = async () => {
    if (!code.trim()) {
      setError("Please enter a recovery code");
      return;
    }

    setError("");
    try {
      const result = await useRecoveryCodeMutation.mutateAsync({
        code: code.replace(/\s/g, ""),
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError("Invalid or already used recovery code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use recovery code");
    }
  };

  const handleSubmit = async () => {
    if (mode === "totp") {
      await handleVerifyTOTP();
    } else {
      await handleUseRecoveryCode();
    }
  };

  const isLoading = verifyMfaMutation.isPending || useRecoveryCodeMutation.isPending;
  const isValid = mode === "totp" ? code.length === 6 : code.length > 0;

  return (
    <Dialog open={open && !success}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            {mode === "totp"
              ? "Enter the code from your authenticator app"
              : "Enter one of your recovery codes"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Verification successful!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              {mode === "totp" ? "Authenticator Code" : "Recovery Code"}
            </Label>
            <Input
              id="mfa-code"
              type="text"
              placeholder={mode === "totp" ? "000000" : "XXXX-XXXX-XXXX"}
              value={code}
              onChange={(e) => {
                const val = e.target.value;
                if (mode === "totp") {
                  setCode(val.replace(/\D/g, "").slice(0, 6));
                } else {
                  setCode(val.toUpperCase());
                }
              }}
              maxLength={mode === "totp" ? 6 : 20}
              className={mode === "totp" ? "font-mono text-center text-2xl tracking-widest" : "font-mono"}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isValid}
              className="flex-1"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Verify
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          <div className="text-center">
            {mode === "totp" ? (
              <button
                onClick={() => {
                  setMode("recovery");
                  setCode("");
                  setError("");
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Use a recovery code instead
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode("totp");
                  setCode("");
                  setError("");
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Use authenticator app
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standalone page component
export function MFAChallengePage() {
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the code from your authenticator app to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MFAChallenge />
        </CardContent>
      </Card>
    </div>
  );
}
