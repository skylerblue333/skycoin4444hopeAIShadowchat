/**
 * DiscoverMode — OS Shell: Discover Mode
 * Feed-powered discovery: AI posts, personas, trending, action cards
 * Upgraded: command submission bar, larger clickable areas, 2-col grids
 */
import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  TrendingUp, Zap, Bot, Globe, RefreshCw, MessageSquare, Heart, Share2,
  Send, Sparkles, ArrowRight, Flame, Hash, Users, Video, Radio,
  ShoppingBag, Wallet, Trophy, Brain, Rocket, Star, ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAppStore } from "@/shared/state/appStore";
import { formatDistanceToNow } from "date-fns";

// Trending topics loaded live from DB — no hardcoded counts

const AI_PERSONAS = [
  { name: "NOVA",   role: "Creator AI", avatar: "N", color: "from-purple-500 to-pink-500",  status: "posting"   },
  { name: "CIPHER", role: "Crypto AI",  avatar: "C", color: "from-cyan-500 to-blue-500",    status: "analyzing" },
  { name: "PRISM",  role: "Social AI",  avatar: "P", color: "from-green-500 to-teal-500",   status: "active"    },
];

const QUICK_COMMANDS = [
  { label: "What's trending?",         icon: TrendingUp },
  { label: "Show me top creators",     icon: Star       },
  { label: "Summarize my feed",        icon: Sparkles   },
  { label: "Best crypto plays today",  icon: Wallet     },
  { label: "Find communities to join", icon: Users      },
  { label: "Recommend streams",        icon: Radio      },
];

const QUICK_LINKS = [
  { label: "Social Feed",  href: "/social",         icon: Globe,       color: "text-cyan-400"   },
  { label: "Explore",      href: "/explore",        icon: Hash,        color: "text-blue-400"   },
  { label: "Reels",        href: "/reels",          icon: Video,       color: "text-pink-400"   },
  { label: "Streaming",    href: "/streaming",      icon: Radio,       color: "text-red-400"    },
  { label: "Marketplace",  href: "/marketplace",    icon: ShoppingBag, color: "text-yellow-400" },
  { label: "Wallet",       href: "/wallet",         icon: Wallet,      color: "text-green-400"  },
  { label: "Tournaments",  href: "/tournaments",    icon: Trophy,      color: "text-orange-400" },
  { label: "AI Brain",     href: "/ai-brain",       icon: Brain,       color: "text-fuchsia-400"},
];

export function DiscoverMode() {
  const { user } = useAuth();
  const { setMode, setChatOverlayOpen, setPendingActionText, feedFilter, setFeedFilter } = useAppStore();
  const { data: postsRaw } = trpc.social.getFeed.useQuery({ limit: 8 });
  const { data: trendingRaw } = trpc.explore.getTrending.useQuery();
  const TRENDING_TOPICS: { tag: string; posts: string; hot: boolean }[] = Array.isArray(trendingRaw)
    ? (trendingRaw as any[]).slice(0, 6).map((t: any, i: number) => ({
        tag: t.hashtag?.startsWith("#") ? t.hashtag : `#${t.hashtag ?? "trending"}`,
        posts: t.count != null ? (t.count >= 1000 ? `${(t.count / 1000).toFixed(1)}K` : String(t.count)) : "—",
        hot: i < 2,
      }))
    : [];
  const posts: any[] = Array.isArray(postsRaw) ? postsRaw : (postsRaw as any)?.posts ?? [];

  const [command, setCommand] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleActionFromPost = (content: string) => {
    setPendingActionText(content);
    setMode("execute");
    setChatOverlayOpen(true);
  };

  const submitCommand = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed) return;
    setPendingActionText(trimmed);
    setMode("execute");
    setChatOverlayOpen(true);
    setCommand("");
  }, [command, setPendingActionText, setMode, setChatOverlayOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCommand();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ── Vote #1 Announcement + Create Account Banner (always visible, sticky) ── */}
        <div className="sticky top-0 z-30 -mx-4 px-4 pt-1 pb-2 bg-background/95 backdrop-blur-md">
          {/* Vote #1 pill */}
          <Link href="/governance">
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full border border-green-500/30 bg-green-500/10 hover:bg-green-500/15 transition-colors cursor-pointer mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-green-300 text-xs font-bold tracking-wider uppercase">Vote #1 Passed</span>
              <span className="w-px h-3 bg-green-500/30" />
              <span className="text-xs font-semibold">
                <span className="text-amber-400 font-mono">SKY4444</span>
                <span className="text-white/40 mx-1">+</span>
                <span className="text-yellow-300 font-mono">DOGE</span>
                <span className="text-white/40 mx-1">+</span>
                <span className="text-red-400 font-mono">TRUMP</span>
              </span>
              <span className="text-white/30 text-xs ml-1">now live →</span>
            </div>
          </Link>

          {/* Create Account CTA — only for logged-out users */}
          {!user && (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-red-500/5 to-yellow-500/5 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-0.5">Create your account — earn TRUMP, DOGE &amp; SKY4444</p>
                <p className="text-xs text-white/50">
                  New accounts receive an airdrop:
                  {" "}<span className="text-amber-400 font-mono font-semibold">100 SKY4444</span>
                  {" + "}<span className="text-yellow-300 font-mono font-semibold">50 DOGE</span>
                  {" + "}<span className="text-red-400 font-mono font-semibold">10 TRUMP</span>
                </p>
              </div>
              <a href={getLoginUrl()} className="shrink-0">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-sm font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                  Create Account →
                </button>
              </a>
            </div>
          )}
        </div>


        {/* ── Command submission bar ── */}
        <div className="card p-4 border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Command the AI</span>
            <span className="text-xs text-slate-500 ml-auto">Shift+Enter for new line</span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — summarize my feed, find trending creators, analyze crypto, write a post…"
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-14 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all duration-150"
            />
            <button
              onClick={submitCommand}
              disabled={!command.trim()}
              className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {/* Quick command chips */}
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {QUICK_COMMANDS.map(cmd => (
              <button
                key={cmd.label}
                onClick={() => handleActionFromPost(cmd.label)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs text-slate-300 hover:text-white hover:bg-slate-700/60 hover:border-slate-600/60 active:scale-[0.98] transition-all duration-150 text-left"
              >
                <cmd.icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Feed filter tabs ── */}
        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
          {(["all", "following", "trending", "ai"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFeedFilter(f)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all active:scale-[0.97] ${
                feedFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "ai" ? "AI World" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Quick navigation links (2-col) ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Quick Access</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="block">
                <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:bg-slate-800/70 hover:border-slate-700/60 active:scale-[0.98] transition-all duration-150 cursor-pointer">
                  <link.icon className={`w-4 h-4 ${link.color} shrink-0`} />
                  <span className="text-sm text-slate-200 font-medium truncate">{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trending topics (2-col) ── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold">Trending Now</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {TRENDING_TOPICS.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-slate-500 py-4">No trending topics yet — be the first to post!</div>
            ) : TRENDING_TOPICS.map(t => (
              <button
                key={t.tag}
                onClick={() => handleActionFromPost(`Tell me about ${t.tag}`)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] text-left ${
                  t.hot
                    ? "bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/25"
                    : "bg-secondary/40 text-slate-300 border border-slate-700/40 hover:bg-secondary/70"
                }`}
              >
                {t.hot ? <Flame className="w-3.5 h-3.5 shrink-0" /> : <Hash className="w-3.5 h-3.5 shrink-0 text-slate-500" />}
                <span className="font-medium truncate">{t.tag}</span>
                <span className="text-xs text-slate-500 ml-auto shrink-0">{t.posts}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Personas live status ── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold">AI World — Live</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-auto" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AI_PERSONAS.map(p => (
              <button
                key={p.name}
                onClick={() => handleActionFromPost(`Talk to ${p.name} — ${p.role}`)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 active:scale-[0.97] transition-all duration-150 border border-transparent hover:border-slate-700/50"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-sm font-bold text-white`}>
                  {p.avatar}
                </div>
                <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.status}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Live feed posts ── */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="card p-8 text-center">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Feed loading...</p>
              <button
                onClick={() => handleActionFromPost("Show me what's trending")}
                className="mt-3 px-4 py-2 rounded-xl bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 active:scale-[0.98] transition-all"
              >
                Ask AI to curate
              </button>
            </div>
          ) : (
            posts.map((post: any) => (
              <div key={post.id} className="card p-4 hover:border-slate-700/60 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {post.author?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-100">{post.author?.name ?? "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "recently"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all">
                        <Heart className="w-3.5 h-3.5" />{post._count?.likes ?? 0}
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all">
                        <MessageSquare className="w-3.5 h-3.5" />{post._count?.comments ?? 0}
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-green-400 hover:bg-green-500/10 active:scale-95 transition-all">
                        <Share2 className="w-3.5 h-3.5" />Share
                      </button>
                      <button
                        onClick={() => handleActionFromPost(`Based on this post: "${post.content.slice(0, 80)}" — what action should I take?`)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-primary bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all font-medium"
                      >
                        <Zap className="w-3.5 h-3.5" />Act on this
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Load more ── */}
        <button
          onClick={() => handleActionFromPost("Show me more content")}
          className="w-full card p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/20 active:scale-[0.99] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Load more or ask AI to curate
        </button>

        {/* Bottom padding for mobile nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}
