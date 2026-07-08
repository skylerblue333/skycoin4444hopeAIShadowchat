import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

export function MFASetup() {
  const { user } = useAuth();
  const [step, setStep] = useState<"initial" | "qr" | "verify" | "recovery" | "complete">("initial");
  const [verificationCode, setVerificationCode] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateMfaMutation = trpc.mfa.generateMfaSecret.useMutation();
  const verifyMfaMutation = trpc.mfa.verifyMfa.useMutation();
  const generateRecoveryCodesMutation = trpc.mfa.generateRecoveryCodes.useMutation();

  const handleGenerateSecret = async () => {
    setError("");
    try {
      const result = await generateMfaMutation.mutateAsync();
      setSecret(result.secret);
      setQrCode(result.qrCodeImage);
      setStep("qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate MFA secret");
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setError("");
    try {
      const result = await verifyMfaMutation.mutateAsync({
        token: verificationCode,
        secret,
      });

      if (result.success) {
        // Generate recovery codes
        const codesResult = await generateRecoveryCodesMutation.mutateAsync();
        setRecoveryCodes(codesResult.codes);
        setStep("recovery");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify MFA code");
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleComplete = () => {
    setStep("complete");
  };

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to set up MFA</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication Setup</CardTitle>
          <CardDescription>
            Secure your account with two-factor authentication using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Initial */}
          {step === "initial" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
                </p>
              </div>
              <Button onClick={handleGenerateSecret} disabled={generateMfaMutation.isPending} className="w-full">
                {generateMfaMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Generate QR Code
              </Button>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === "qr" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app:
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <img src={qrCode} alt="MFA QR Code" className="h-64 w-64" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="secret">Or enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono" id="secret" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep("verify")} className="w-full">
                Next: Verify Code
              </Button>
            </div>
          )}

          {/* Step 3: Verify Code */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 3: Verify Your Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app:
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={verifyMfaMutation.isPending || verificationCode.length !== 6}
                className="w-full"
              >
                {verifyMfaMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Verify Code
              </Button>

              <Button variant="outline" onClick={() => setStep("qr")} className="w-full">
                Back
              </Button>
            </div>
          )}

          {/* Step 4: Recovery Codes */}
          {step === "recovery" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 4: Save Recovery Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Save these recovery codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Each code can only be used once. Store them securely.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleCopyCode(code, index)}
                  >
                    <span className="font-mono text-sm">{code}</span>
                    {copiedIndex === index && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Click on any code to copy it to your clipboard
              </p>

              <Button onClick={handleComplete} className="w-full">
                I've Saved My Recovery Codes
              </Button>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold">MFA Enabled Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is now protected with two-factor authentication.
                </p>
              </div>
              <Button onClick={() => window.location.href = "/settings"} className="w-full">
                Back to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
