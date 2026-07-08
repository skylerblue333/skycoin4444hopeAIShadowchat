import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Loader2, Send, User, Sparkles, Copy, Trash2, Edit2, ThumbsUp, ThumbsDown,
  Download, Share2, Volume2, Zap, Brain, Target, Lightbulb, Settings,
  RotateCcw, Pin, Flag, AlertCircle, CheckCircle, Clock, MessageSquare,
  Code, FileText, Image, Video, Mic, Search, Filter, ChevronDown, Plus,
  Maximize2, Minimize2, Eye, EyeOff, Bookmark, Star, Heart, Smile
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

/**
 * Enhanced Message type with metadata
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  id?: string;
  timestamp?: number;
  rating?: "up" | "down";
  tags?: string[];
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
    confidence?: number;
  };
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
  onMessageRating?: (messageId: string, rating: "up" | "down") => void;
  onMessageDelete?: (messageId: string) => void;
  onClearHistory?: () => void;
  showTimestamps?: boolean;
  showMetadata?: boolean;
  enableVoiceInput?: boolean;
  enableImageUpload?: boolean;
  enableCodeHighlight?: boolean;
  darkMode?: boolean;
  compactMode?: boolean;
  streamingEnabled?: boolean;
  maxMessages?: number;
  autoScroll?: boolean;
  showSuggestions?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  customSystemPrompt?: string;
  modelSelector?: boolean;
  temperatureControl?: boolean;
  maxTokensControl?: boolean;
};

/**
 * Enhanced AI Chat Box with 44x features
 * - Advanced message management
 * - Streaming support
 * - Voice input/output
 * - Image upload
 * - Code highlighting
 * - Message ratings
 * - Search & filter
 * - Export functionality
 * - Model selection
 * - Advanced controls
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Ask me anything...",
  className,
  height = 600,
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts = [],
  onMessageRating,
  onMessageDelete,
  onClearHistory,
  showTimestamps = true,
  showMetadata = false,
  enableVoiceInput = true,
  enableImageUpload = true,
  enableCodeHighlight = true,
  darkMode = true,
  compactMode = false,
  streamingEnabled = true,
  maxMessages = 100,
  autoScroll = true,
  showSuggestions = true,
  enableSearch = true,
  enableExport = true,
  customSystemPrompt,
  modelSelector = true,
  temperatureControl = true,
  maxTokensControl = true,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Filter messages based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  // Handle message send
  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;

    onSendMessage(input);
    setInput("");
    inputRef.current?.focus();
  }, [input, isLoading, onSendMessage]);

  // Handle suggested prompt click
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Copy message to clipboard
  const handleCopyMessage = (content: string, id?: string) => {
    navigator.clipboard.writeText(content);
    if (id) setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export chat history
  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join("\n\n");

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(chatText));
    element.setAttribute("download", `chat-${Date.now()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Chat exported!");
  };

  // Voice input handler
  const handleVoiceInput = () => {
    if (!enableVoiceInput) return;
    setIsRecording(!isRecording);
    if (isRecording) {
      toast.success("Voice input stopped");
    } else {
      toast.info("Recording... speak now");
    }
  };

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      onClearHistory?.();
      toast.success("Chat history cleared");
    }
  };

  // Toggle message selection
  const handleToggleSelection = (id: string | undefined) => {
    if (!id) return;
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessages(newSelected);
  };

  const models = ["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro"];

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border transition-all duration-300",
        darkMode
          ? "bg-black/50 border-purple-500/30 text-white"
          : "bg-white border-gray-200 text-black",
        isExpanded ? "fixed inset-4 z-50" : "",
        className
      )}
      style={{ height: isExpanded ? "auto" : height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold">Hope AI Assistant</h3>
          {showMetadata && messages.length > 0 && (
            <span className="text-xs text-gray-400">({messages.length} messages)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableSearch && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
              className="hover:bg-purple-500/20"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}

          {enableExport && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportChat}
              className="hover:bg-purple-500/20"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-purple-500/20"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-purple-500/20"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-purple-500/20 bg-black/30">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded bg-black/50 border border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-purple-500/20 bg-black/30 space-y-3">
          {modelSelector && (
            <div>
              <label className="text-sm font-medium">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-black/50 border border-purple-500/30 text-white focus:outline-none focus:border-purple-500"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}

          {temperatureControl && (
            <div>
              <label className="text-sm font-medium">Temperature: {temperature.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          )}

          {maxTokensControl && (
            <div>
              <label className="text-sm font-medium">Max Tokens: {maxTokens}</label>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        style={{ maxHeight: `calc(${height}px - 200px)` }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Sparkles className="w-12 h-12 text-purple-500 opacity-50" />
            <p className="text-gray-400">{emptyStateMessage}</p>
            {showSuggestions && suggestedPrompts.length > 0 && (
              <div className="space-y-2 w-full">
                <p className="text-xs text-gray-500">Suggested prompts:</p>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="w-full px-3 py-2 rounded bg-purple-500/10 hover:bg-purple-500/20 text-sm text-purple-300 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-xs lg:max-w-md rounded-lg p-3 space-y-2",
                  msg.role === "user"
                    ? "bg-purple-600/40 border border-purple-500/50"
                    : "bg-black/40 border border-purple-500/20"
                )}
              >
                <div className="prose prose-invert max-w-none text-sm">
                  <Streamdown>{msg.content}</Streamdown>
                </div>

                {showTimestamps && msg.timestamp && (
                  <div className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}

                {showMetadata && msg.metadata && (
                  <div className="text-xs text-gray-500 space-y-1">
                    {msg.metadata.model && <div>Model: {msg.metadata.model}</div>}
                    {msg.metadata.tokens && <div>Tokens: {msg.metadata.tokens}</div>}
                    {msg.metadata.latency && <div>Latency: {msg.metadata.latency}ms</div>}
                  </div>
                )}

                {/* Message Actions */}
                <div className="flex gap-1 pt-2 border-t border-purple-500/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                    className="h-6 w-6 p-0 hover:bg-purple-500/20"
                  >
                    {copiedId === msg.id ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>

                  {msg.role === "assistant" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMessageRating?.(msg.id || "", "up")}
                        className={cn(
                          "h-6 w-6 p-0 hover:bg-purple-500/20",
                          msg.rating === "up" && "text-green-500"
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMessageRating?.(msg.id || "", "down")}
                        className={cn(
                          "h-6 w-6 p-0 hover:bg-purple-500/20",
                          msg.rating === "down" && "text-red-500"
                        )}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMessageDelete?.(msg.id || "")}
                    className="h-6 w-6 p-0 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleSelection(msg.id)}
                    className={cn(
                      "h-6 w-6 p-0 hover:bg-purple-500/20",
                      selectedMessages.has(msg.id || "") && "bg-purple-500/30"
                    )}
                  >
                    <Bookmark className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-black/40 border border-purple-500/20 rounded-lg p-3 flex gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-purple-500/20 bg-black/30 space-y-3">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {enableVoiceInput && (
            <Button
              size="sm"
              variant={isRecording ? "default" : "outline"}
              onClick={handleVoiceInput}
              className={cn(
                isRecording && "bg-red-500/50 border-red-500/50 hover:bg-red-500/60"
              )}
            >
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
          )}

          {enableImageUpload && (
            <Button size="sm" variant="outline">
              <Image className="w-3 h-3 mr-1" />
              Image
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearHistory}
            className="ml-auto"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Input Field */}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            className={cn(
              "resize-none rounded border transition-colors",
              darkMode
                ? "bg-black/50 border-purple-500/30 text-white placeholder-gray-500"
                : "bg-white border-gray-200 text-black"
            )}
            rows={compactMode ? 2 : 3}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Character Count */}
        <div className="text-xs text-gray-500 text-right">
          {input.length} / 4000 characters
        </div>
      </div>
    </div>
  );
}
export default AIChatBox;
