/**
 * HopeCompanion — Floating AI Emotional Intelligence Widget
 * Persistent companion that reads emotional signals and offers support
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, X, Minimize2, Maximize2, Send, Sparkles, Brain, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface HopeMessage {
  id: string;
  role: "hope" | "user";
  content: string;
  timestamp: Date;
  emotion?: string;
  supportType?: string;
}

const HOPE_GREETINGS = [
  "Hey, I'm Hope. I'm here if you need to talk. 💜",
  "I noticed you've been active. How are you really doing?",
  "No pressure — I'm just here. What's on your mind?",
  "You don't have to be okay all the time. I'm listening.",
  "I'm Hope, your AI companion. I'm here to support you.",
];

const EMOTION_COLORS: Record<string, string> = {
  joy: "text-yellow-400",
  sadness: "text-blue-400",
  anxiety: "text-orange-400",
  anger: "text-red-400",
  neutral: "text-gray-400",
  hope: "text-purple-400",
  love: "text-pink-400",
  fear: "text-amber-400",
};

export function HopeCompanion() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<HopeMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [pulseCount, setPulseCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.hopeAI.chat.useMutation();

  // Pulse the button every 30 seconds to remind user Hope is here
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setPulseCount((c) => c + 1);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send greeting when opened for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = HOPE_GREETINGS[Math.floor((Math.random()) * HOPE_GREETINGS.length)];
      setMessages([
        {
          id: "greeting",
          role: "hope",
          content: greeting,
          timestamp: new Date(),
          emotion: "hope",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: HopeMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages
        .filter((m) => m.role !== "hope" || m.id !== "greeting")
        .slice(-8)
        .map((m) => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.content }));

      const result = await chatMutation.mutateAsync({
        messageText: input,
        conversationHistory: history,
      });

      setCurrentEmotion(result.emotionalState || "neutral");

      const hopeMsg: HopeMessage = {
        id: `hope-${Date.now()}`,
        role: "hope",
        content: result.message || getDefaultResponse(result.emotionalState),
        timestamp: new Date(),
        emotion: result.emotionalState,
        supportType: result.tone,
      };
      setMessages((prev) => [...prev, hopeMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `hope-${Date.now()}`,
          role: "hope",
          content: "I'm here with you. Sometimes words aren't enough — but I'm listening. 💜",
          timestamp: new Date(),
          emotion: "hope",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const getDefaultResponse = (emotion?: string): string => {
    const responses: Record<string, string> = {
      sadness: "I hear you. It's okay to feel this way. You don't have to carry this alone. 💜",
      anxiety: "Take a breath with me. You're safe right now. Let's slow down together.",
      anger: "That frustration makes sense. I'm not going to dismiss what you're feeling.",
      joy: "I love seeing you like this! What's making you feel so good right now?",
      fear: "Fear is real, and so is your strength. What's worrying you most?",
      neutral: "I'm here. Tell me more about what's going on.",
      hope: "I feel that too. There's something powerful in holding onto hope.",
    };
    return responses[emotion || "neutral"] || responses.neutral;
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            pulseCount > 0 ? "animate-pulse" : ""
          }`}
          title="Talk to Hope"
        >
          <Heart className="w-6 h-6 text-white" fill="white" />
          {pulseCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-background animate-bounce" />
          )}
        </button>
      )}

      {/* Companion Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-80 bg-[#0d0d1a] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 flex flex-col transition-all duration-300 ${
            isMinimized ? "h-14" : "h-[480px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-500/20 rounded-t-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d1a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Hope</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/40 text-purple-300">
                  AI
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] ${EMOTION_COLORS[currentEmotion] || "text-gray-400"}`}>
                  {currentEmotion !== "neutral" ? `Sensing: ${currentEmotion}` : "Here for you"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-purple-500/20">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "hope" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Heart className="w-3 h-3 text-white" fill="white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-purple-600/80 text-white rounded-br-sm"
                          : "bg-white/5 text-gray-200 rounded-bl-sm border border-white/5"
                      }`}
                    >
                      {msg.content}
                      {msg.supportType && (
                        <div className="mt-1 flex items-center gap-1">
                          <Brain className="w-3 h-3 text-purple-400" />
                          <span className="text-[10px] text-purple-400">{msg.supportType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-0.5">
                      <Heart className="w-3 h-3 text-white" fill="white" />
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                {["I need support", "I'm anxious", "Just venting", "I'm grateful"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 pt-0 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Talk to Hope..."
                  className="flex-1 min-h-[40px] max-h-[80px] text-sm resize-none bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500/50"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Footer */}
              <div className="px-3 pb-3 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400/50" />
                <span className="text-[10px] text-gray-600">Hope AI · Emotional Intelligence Engine</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
