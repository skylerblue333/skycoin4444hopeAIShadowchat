import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Shield, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";

export function MFASettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const disableMfaMutation = trpc.mfa.disableMfa.useMutation();
  const generateRecoveryCodesMutation = trpc.mfa.generateRecoveryCodes.useMutation();

  const handleDisableMFA = async () => {
    setError("");
    setSuccess("");
    try {
      await disableMfaMutation.mutateAsync();
      setSuccess("MFA has been disabled");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable MFA");
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    setError("");
    try {
      const result = await generateRecoveryCodesMutation.mutateAsync();
      setRecoveryCodes(result.codes);
      setShowRecoveryCodes(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate recovery codes");
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to manage MFA settings</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* MFA Status */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="flex items-center gap-2">
                {user.mfaEnabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-700">
                      Two-factor authentication is enabled
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-amber-700">
                      Two-factor authentication is not enabled
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            {user.mfaEnabled ? (
              <>
                <Dialog open={showRecoveryCodes} onOpenChange={setShowRecoveryCodes}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRegenerateRecoveryCodes}
                      disabled={generateRecoveryCodesMutation.isPending}
                    >
                      {generateRecoveryCodesMutation.isPending && (
                        <Spinner className="mr-2 h-4 w-4" />
                      )}
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Recovery Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Recovery Codes</DialogTitle>
                      <DialogDescription>
                        Save these codes in a safe place. Each code can only be used once.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                      {recoveryCodes.map((code, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleCopyCode(code, index)}
                        >
                          <span className="font-mono text-sm">{code}</span>
                          {copiedIndex === index && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click on any code to copy it to your clipboard
                    </p>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDisableMFA}
                  disabled={disableMfaMutation.isPending}
                >
                  {disableMfaMutation.isPending && (
                    <Spinner className="mr-2 h-4 w-4" />
                  )}
                  Disable Two-Factor Authentication
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => setLocation("/mfa-setup")}
              >
                Enable Two-Factor Authentication
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="space-y-2 pt-4 border-t text-sm text-muted-foreground">
            <p>
              Two-factor authentication adds an extra layer of security to your account.
              When enabled, you'll need to enter a code from your authenticator app in addition
              to your password when signing in.
            </p>
            <p>
              Keep your recovery codes safe. You can use them to access your account if you
              lose access to your authenticator app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
