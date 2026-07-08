import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Bot, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HopeAIAssistant() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessageMutation = trpc.hopeAI.chat.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setChatHistory((prev) => [...prev, { role: "user", content: prompt }]);
      setPrompt("");
    },
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { role: "ai", content: data.response || "No response." }]);
    },
    onError: (error) => {
      toast.error(`Error communicating with Hope AI: ${error.message}`);
      // Remove the user message if the request failed
      setChatHistory((prev) => prev.slice(0, -1));
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSendMessage = () => {
    if (!prompt.trim()) {
      return;
    }
    sendMessageMutation.mutate({ message: prompt });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Bot className="mr-3 h-8 w-8 text-blue-500" />
        Hope AI Assistant
      </h1>

      <Card className="mb-6 h-[60vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with Hope</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Hello! I am Hope AI. How can I assist you today?</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`p-2 rounded-full ${msg.role === "user" ? "bg-blue-100 ml-3" : "bg-gray-100 mr-3"}`}>
                    {msg.role === "user" ? <User className="h-5 w-5 text-blue-600" /> : <Bot className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start max-w-[80%] flex-row">
                <div className="p-2 rounded-full bg-gray-100 mr-3">
                  <Bot className="h-5 w-5 text-gray-600" />
                </div>
                <div className="p-3 rounded-lg bg-gray-200 text-gray-800 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex space-x-2">
        <Textarea
          placeholder="Type your message here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={2}
          className="flex-grow"
          disabled={isLoading || !isAuthenticated}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={isLoading || !isAuthenticated || !prompt.trim()}
          className="h-auto"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {!isAuthenticated && (
        <p className="text-sm text-red-500 mt-2">Please log in to chat with Hope AI.</p>
      )}
    </div>
  );
}
