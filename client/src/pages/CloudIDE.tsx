import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Code, Save, Play, Share } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CloudIDE() {
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const createProjectMutation = trpc.cloudIDE.createProject.useMutation({
    onSuccess: (data) => {
      setProjectId(data.projectId);
      toast.success("New project created!");
    },
    onError: (error) => {
      toast.error(`Error creating project: ${error.message}`);
    },
  });

  const saveProjectMutation = trpc.cloudIDE.saveProject.useMutation({
    onMutate: () => setIsLoading(true),
    onSuccess: () => toast.success("Project saved!"),
    onError: (error) => toast.error(`Error saving project: ${error.message}`),
    onSettled: () => setIsLoading(false),
  });

  const executeCodeMutation = trpc.cloudIDE.executeCode.useMutation({
    onMutate: () => setIsLoading(true),
    onSuccess: (data) => setOutput(data.output),
    onError: (error) => toast.error(`Error executing code: ${error.message}`),
    onSettled: () => setIsLoading(false),
  });

  useEffect(() => {
    if (isAuthenticated && !projectId) {
      createProjectMutation.mutate();
    }
  }, [isAuthenticated, projectId, createProjectMutation]);

  const handleSave = () => {
    if (!projectId || !code.trim()) {
      toast.error("No project or code to save.");
      return;
    }
    saveProjectMutation.mutate({ projectId, code });
  };

  const handleExecute = () => {
    if (!projectId || !code.trim()) {
      toast.error("No project or code to execute.");
      return;
    }
    executeCodeMutation.mutate({ projectId, code });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Code className="mr-3 h-8 w-8 text-purple-500" />
        Cloud IDE
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Code Editor {projectId && `(Project: ${projectId})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={20}
            className="font-mono mb-4"
            disabled={!isAuthenticated || !projectId}
          />
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={isLoading || !isAuthenticated || !projectId}>
              {isLoading && saveProjectMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <Button onClick={handleExecute} disabled={isLoading || !isAuthenticated || !projectId}>
              {isLoading && executeCodeMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Execute
            </Button>
            <Button disabled={!isAuthenticated || !projectId} variant="outline">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
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
