import React, { useState, useCallback, useEffect } from "react";
import { Globe, Volume2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TranslationLayerProps {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  onTranslate?: (translatedText: string) => void;
  autoTranslate?: boolean;
  showOverlay?: boolean;
  position?: "top" | "bottom" | "inline";
}

interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: Date;
}

export function TranslationLayer({
  sourceText,
  sourceLanguage,
  targetLanguage,
  onTranslate,
  autoTranslate = true,
  showOverlay = true,
  position = "bottom",
}: TranslationLayerProps) {
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confidence, setConfidence] = useState(0);

    const performTranslation = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

            const mockTranslations: Record<string, Record<string, string>> = {
        "Chinese|English": {
          "你好": "Hello",
          "谢谢": "Thank you",
          "很高兴见到你": "Nice to meet you",
          "今天怎么样": "How are you today",
          "很好": "Very good",
        },
        "Spanish|English": {
          Hola: "Hello",
          Gracias: "Thank you",
          "¿Cómo estás?": "How are you?",
          "Mucho gusto": "Nice to meet you",
        },
        "Japanese|English": {
          こんにちは: "Hello",
          ありがとう: "Thank you",
          "よろしくお願いします": "Nice to meet you",
        },
      };

      const key = `${sourceLanguage}|${targetLanguage}`;
      const translated =
        mockTranslations[key]?.[sourceText] ||
        `[${sourceLanguage} → ${targetLanguage}] ${sourceText}`;

      setTranslatedText(translated);
      setConfidence(0.92 + (Math.random()) * 0.08);
      setShowTranslation(true);

      if (onTranslate) {
        onTranslate(translated);
      }
    } catch (error) {
            toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLanguage, targetLanguage, onTranslate]);

  // Auto-translate if enabled
  useEffect(() => {
    if (autoTranslate && sourceText.trim() && sourceLanguage !== targetLanguage) {
      performTranslation();
    }
  }, [sourceText, autoTranslate, sourceLanguage, targetLanguage, performTranslation]);

  const handleCopyTranslation = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success("Translation copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, language: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "Chinese" ? "zh-CN" : 
                       language === "Spanish" ? "es-ES" :
                       language === "Japanese" ? "ja-JP" : "en-US";
      window.speechSynthesis.speak(utterance);
      toast.success("Playing audio...");
    } else {
      toast.error("Speech synthesis not supported");
    }
  };

  if (!showOverlay || !showTranslation || !translatedText) {
    return null;
  }

  const overlayClasses = {
    top: "top-0 left-0 right-0",
    bottom: "bottom-0 left-0 right-0",
    inline: "relative",
  };

  return (
    <div
      className={`${
        position !== "inline"
          ? `fixed ${overlayClasses[position]} z-50 pointer-events-none`
          : ""
      }`}
    >
      <div
        className={`${
          position !== "inline" ? "pointer-events-auto" : ""
        } bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-sm border border-purple-500/30 ${
          position === "top" ? "rounded-b-lg" : "rounded-t-lg"
        } p-4 shadow-2xl`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-gray-300">
                {sourceLanguage} → {targetLanguage}
              </span>
              <Badge
                variant="outline"
                className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
              >
                {Math.round(confidence * 100)}% confidence
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSpeak(translatedText, targetLanguage)}
                className="h-6 w-6 p-0 hover:bg-purple-500/20"
              >
                <Volume2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyTranslation}
                className="h-6 w-6 p-0 hover:bg-purple-500/20"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Translation Text */}
          <div className="space-y-2">
            <div className="bg-black/20 rounded p-3">
              <p className="text-sm text-gray-300 mb-1 text-xs">Original:</p>
              <p className="text-white font-medium text-sm">{sourceText}</p>
            </div>

            <div className="bg-purple-500/10 rounded p-3 border border-purple-500/20">
              <p className="text-sm text-purple-300 mb-1 text-xs">Translation:</p>
              <p className="text-purple-100 font-medium text-sm">{translatedText}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSpeak(sourceText, sourceLanguage)}
              className="text-xs h-7"
            >
              <Volume2 className="w-3 h-3 mr-1" />
              Hear Original
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSpeak(translatedText, targetLanguage)}
              className="text-xs h-7"
            >
              <Volume2 className="w-3 h-3 mr-1" />
              Hear Translation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranslationLayer;
