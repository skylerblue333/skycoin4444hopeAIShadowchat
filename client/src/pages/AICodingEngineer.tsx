import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Code, Play, Bug, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AICodingEngineer() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCodeMutation = trpc.aiEngineer.create.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setGeneratedCode("");
      setOutput("");
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code || "No code generated.");
      toast.success("Code generated successfully!");
    },
    onError: (error) => {
      toast.error(`Error generating code: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const executeCodeMutation = trpc.aiEngineer.execute.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setOutput("");
    },
    onSuccess: (data) => {
      setOutput(data.output || "No output.");
      toast.success("Code executed successfully!");
    },
    onError: (error) => {
      toast.error(`Error executing code: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const debugCodeMutation = trpc.aiEngineer.debug.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setOutput("");
    },
    onSuccess: (data) => {
      setOutput(data.debugInfo || "No debug information.");
      toast.success("Code debugged successfully!");
    },
    onError: (error) => {
      toast.error(`Error debugging code: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleGenerateCode = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate code.");
      return;
    }
    generateCodeMutation.mutate({ prompt });
  };

  const handleExecuteCode = () => {
    if (!generatedCode.trim()) {
      toast.error("No code to execute. Please generate code first.");
      return;
    }
    executeCodeMutation.mutate({ code: generatedCode });
  };

  const handleDebugCode = () => {
    if (!generatedCode.trim()) {
      toast.error("No code to debug. Please generate code first.");
      return;
    }
    debugCodeMutation.mutate({ code: generatedCode });
  };

  const handleDownloadCode = () => {
    if (!generatedCode.trim()) {
      toast.error("No code to download.");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([generatedCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "generated_code.txt";
    document.body.appendChild(element); // Required for Firefox
    element.click();
    document.body.removeChild(element); // Clean up
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">AI Coding Engineer</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Code Generation Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your coding request here (e.g., 'Write a Python function to reverse a string')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="mb-4"
          />
          <Button onClick={handleGenerateCode} disabled={isLoading || !isAuthenticated}>
            {isLoading && generateCodeMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code className="mr-2 h-4 w-4" />}
            Generate Code
          </Button>
        </CardContent>
      </Card>

      {generatedCode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto mb-4">
              <code>{generatedCode}</code>
            </pre>
            <div className="flex space-x-2">
              <Button onClick={handleExecuteCode} disabled={isLoading || !isAuthenticated}>
                {isLoading && executeCodeMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Execute Code
              </Button>
              <Button onClick={handleDebugCode} disabled={isLoading || !isAuthenticated}>
                {isLoading && debugCodeMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
                Debug Code
              </Button>
              <Button onClick={handleDownloadCode} disabled={!generatedCode.trim()}>
                <Download className="mr-2 h-4 w-4" />
                Download Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output / Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>{output}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
