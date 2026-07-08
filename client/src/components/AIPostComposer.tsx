import { useState } from "react";
import { Sparkles, Hash, AtSign, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AIPostComposerProps {
  onPost?: () => void;
}

export function AIPostComposer({ onPost }: AIPostComposerProps) {
  const [content, setContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const createPost = trpc.feed.create.useMutation({
    onSuccess: () => {
      setContent("");
      setSuggestions([]);
      toast.success("Post published!");
      onPost?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateSuggestions = async () => {
    if (!content.trim()) {
      toast.info("Type something first, then let AI enhance it.");
      return;
    }
    setAiLoading(true);
    // Simulate AI hashtag + content suggestions
    await new Promise(r => setTimeout(r, 800));
    const words = content.toLowerCase().split(/\s+/);
    const tags = words
      .filter(w => w.length > 4)
      .slice(0, 3)
      .map(w => `#${w.replace(/[^a-z0-9]/g, "")}`);
    const extras = ["#skycoin4444", "#web3", "#crypto"].filter(t => !tags.includes(t));
    setSuggestions([...tags, ...extras].slice(0, 5));
    setAiLoading(false);
  };

  const addHashtag = (tag: string) => {
    setContent(prev => prev + (prev.endsWith(" ") ? "" : " ") + tag + " ");
  };

  const charCount = content.length;
  const maxChars = 500;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">AI Post Composer</span>
      </div>

      <Textarea
        value={content}
        onChange={e => setContent(e.target.value.slice(0, maxChars))}
        placeholder="What's on your mind? Let AI help you craft the perfect post..."
        className="min-h-[100px] resize-none bg-background"
      />

      {/* Char counter */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{charCount}/{maxChars}</span>
        <div className="flex gap-1">
          <button onClick={() => setContent(prev => prev + " @")} className="p-1 hover:text-primary transition-colors">
            <AtSign className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setContent(prev => prev + " #")} className="p-1 hover:text-primary transition-colors">
            <Hash className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-primary transition-colors">
            <Image className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(tag => (
            <button
              key={tag}
              onClick={() => addHashtag(tag)}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={aiLoading}
          className="flex-1"
        >
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
          AI Enhance
        </Button>
        <Button
          size="sm"
          onClick={() => createPost.mutate({ content, type: "text" })}
          disabled={!content.trim() || createPost.isPending}
          className="flex-1"
        >
          {createPost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
          Post
        </Button>
      </div>
    </div>
  );
}
