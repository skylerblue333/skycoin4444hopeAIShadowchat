/**
 * ExecuteMode — OS Shell: Execute Mode
 * Chat command terminal + action engine + payment flows
 * Core "Chat → AI → Action → Income" loop
 *
 * Voice fix: single SpeechRecognition instance, interimResults=true for live
 * placeholder preview, but ONLY the isFinal result is committed to input state
 * — prevents double-write from accumulated partial transcripts.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Zap, CreditCard, Gift, Briefcase, Plus, Mic, MicOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAppStore } from "@/shared/state/appStore";
import { parseIntent } from "@/core/actions/actionEngine";
import { ACTION_TYPES } from "@/core/actions/actionTypes";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actionLabel?: string;
  actionAmount?: number;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: CreditCard, label: "Pay",    prompt: "I want to pay ",          color: "text-green-400"  },
  { icon: Gift,       label: "Tip",    prompt: "Send a tip to ",          color: "text-yellow-400" },
  { icon: Briefcase,  label: "Hire AI",prompt: "I need an AI agent to ",  color: "text-purple-400" },
  { icon: Plus,       label: "Create", prompt: "Create a listing for ",   color: "text-cyan-400"   },
];

export function ExecuteMode() {
  const { pendingActionText, setPendingActionText } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "system",
    content: 'ShadowChat OS ready. Type a command or speak. Try: "Pay $20 for logo design" or "Hire an AI agent to write copy".',
    timestamp: new Date(),
  }]);
  const [input, setInput]           = useState("");
  const [interimText, setInterimText] = useState(""); // live preview — never committed directly
  const [loading, setLoading]       = useState(false);
  const [listening, setListening]   = useState(false);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const autoRestartRef = useRef(true);
  const lastFinalRef   = useRef("");   // dedup guard — prevents firing twice for same utterance

  const aiChat = trpc.ai.chat.useMutation();

  useEffect(() => {
    if (pendingActionText) {
      setInput(pendingActionText);
      setPendingActionText("");
    }
  }, [pendingActionText, setPendingActionText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Voice engine ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Tear down any existing instance first
    try { recognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.continuous      = false;   // one utterance → prevents transcript accumulation
    rec.interimResults  = true;    // show live preview in placeholder
    rec.lang            = "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let interim = "";
      let finalText = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += t;
        } else {
          interim += t;
        }
      }

      // Show interim as placeholder preview only
      if (interim) setInterimText(interim);

      // Commit final result exactly once (dedup guard)
      if (finalText) {
        const cleaned = finalText.trim();
        if (cleaned && cleaned !== lastFinalRef.current) {
          lastFinalRef.current = cleaned;
          setInput(prev => {
            const base = prev.trim();
            return base ? `${base} ${cleaned}` : cleaned;
          });
          setInterimText("");
        }
      }
    };

    rec.onend = () => {
      setListening(false);
      setInterimText("");
      lastFinalRef.current = "";
      // Auto-restart for continuous ambient listening
      if (autoRestartRef.current) {
        setTimeout(startListening, 300);
      }
    };

    rec.onerror = (e: any) => {
      setListening(false);
      setInterimText("");
      if (e.error === "not-allowed") {
        autoRestartRef.current = false;
        return;
      }
      if (autoRestartRef.current) {
        setTimeout(startListening, 800);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {}
  }, []);

  // Auto-start on mount
  useEffect(() => {
    autoRestartRef.current = true;
    startListening();
    return () => {
      autoRestartRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [startListening]);

  const toggleListening = () => {
    if (listening) {
      autoRestartRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
    } else {
      autoRestartRef.current = true;
      startListening();
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setInterimText("");
    lastFinalRef.current = "";

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const intent = parseIntent(content);
    try {
      const res = await aiChat.mutateAsync({
        message: content,
        systemPrompt: `You are the ShadowChat OS action engine. Intent detected: ${intent.type}. Confirm the action concisely in 1-2 sentences.`,
      });
      const aiContent = (res as any)?.content ?? (res as any)?.message ?? "Action queued.";
      const hasAction  = intent.type !== ACTION_TYPES.PLAIN_TEXT;
      const payloadAmount = (intent.payload as any)?.amount as number | undefined;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        actionLabel: hasAction ? (
          intent.type === ACTION_TYPES.PAYMENT      ? "Confirm Payment" :
          intent.type === ACTION_TYPES.TIP          ? "Send Tip"        :
          intent.type === ACTION_TYPES.CALL_AI_AGENT? "Launch Agent"    :
          intent.type === ACTION_TYPES.CREATE_LISTING?"Create Listing"  : "Execute"
        ) : undefined,
        actionAmount: payloadAmount,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Action queued. Processing...",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === "user"   ? "bg-primary text-primary-foreground" :
              msg.role === "system" ? "bg-secondary/30 text-muted-foreground text-sm border border-border/30" :
                                      "bg-secondary text-foreground"
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.actionLabel && (
                <button className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-lg text-xs font-medium text-primary transition-colors">
                  <Zap className="w-3 h-3" />
                  {msg.actionLabel}{msg.actionAmount ? ` — $${msg.actionAmount}` : ""}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => setInput(a.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-full text-xs whitespace-nowrap transition-colors shrink-0">
              <Icon className={`w-3 h-3 ${a.color}`} />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-2xl border border-border/50 px-3 py-2">
          <button onClick={toggleListening}
            className={`p-1.5 rounded-lg transition-colors ${listening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
            title={listening ? "Stop listening" : "Start voice input"}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={interimText ? `🎤 ${interimText}…` : 'Type a command… "Pay $20", "Hire AI", "Create listing"'}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1.5">
          {listening
            ? interimText ? `🎤 Hearing: "${interimText}"` : "🎤 Listening… speak your command"
            : "Tap mic to speak · Enter to send"}
        </p>
      </div>
    </div>
  );
}
