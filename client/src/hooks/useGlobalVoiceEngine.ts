/**
 * GlobalVoiceEngine — Always-on voice command engine with mute support
 *
 * Rules:
 * - Starts MUTED — user must click the unmute button in AlwaysOnVoice
 * - When unmuted: single module-level SpeechRecognition, never destroyed
 * - Auto-restarts after end/error with exponential back-off (only when unmuted)
 * - Listens for "voice-mute-toggle" CustomEvent to pause/resume
 * - Only one instance ever exists — calling the hook multiple times is safe
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/shared/state/appStore";

// ─── Browser Speech API type shims ────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrEvent) => void) | null;
}
interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrEvent extends Event {
  error: string;
  message: string;
}

// ─── Intent map ───────────────────────────────────────────────────────────────
const INTENT_MAP: Array<{ patterns: RegExp[]; route?: string; action?: string; label: string }> = [
  { patterns: [/\b(go to |open |show )?(social|feed|discover)\b/i],           route: "/social",         label: "Social Feed" },
  { patterns: [/\b(go to |open |show )?explore\b/i],                          route: "/explore",        label: "Explore" },
  { patterns: [/\b(go to |open |show )?(messages?|dms?|inbox)\b/i],           route: "/messages",       label: "Messages" },
  { patterns: [/\b(go to |open |show )?communities?\b/i],                     route: "/community",      label: "Communities" },
  { patterns: [/\b(go to |open |show )?reels?\b/i],                           route: "/reels",          label: "Reels" },
  { patterns: [/\b(go to |open |show )?stories?\b/i],                         route: "/stories",        label: "Stories" },
  { patterns: [/\b(go to |open |show )?(streaming?|live|go live)\b/i],        route: "/streaming",      label: "Streaming" },
  { patterns: [/\b(go to |open |show )?(creator|studio)\b/i],                 route: "/creator-studio", label: "Creator Hub" },
  { patterns: [/\b(go to |open |show )?trending\b/i],                         route: "/trending",       label: "Trending" },
  { patterns: [/\b(go to |open |show )?channels?\b/i],                        route: "/channels",       label: "Channels" },
  { patterns: [/\b(go to |open |show )?leaderboard\b/i],                      route: "/leaderboards",   label: "Leaderboard" },
  { patterns: [/\b(go to |open |show )?events?\b/i],                          route: "/events",         label: "Events" },
  { patterns: [/\b(go to |open |show )?(wallet|my wallet)\b/i],               route: "/wallet",         label: "Wallet" },
  { patterns: [/\b(go to |open |show )?portfolio\b/i],                        route: "/portfolio",      label: "Portfolio" },
  { patterns: [/\b(go to |open |show )?(nft|nfts)\b/i],                       route: "/nft-gallery",    label: "NFT Gallery" },
  { patterns: [/\b(go to |open |show )?(crypto hub|crypto|mining hub)\b/i],   route: "/crypto-hub",     label: "Crypto Hub" },
  { patterns: [/\b(go to |open |show )?(swap|token swap|exchange)\b/i],       route: "/token-swap",     label: "Token Swap" },
  { patterns: [/\b(go to |open |show )?staking?\b/i],                         route: "/staking",        label: "Staking" },
  { patterns: [/\b(go to |open |show )?(yield|farming)\b/i],                  route: "/yield-farming",  label: "Yield Farm" },
  { patterns: [/\b(go to |open |show )?(trading|trade)\b/i],                  route: "/trading",        label: "Trading" },
  { patterns: [/\b(go to |open |show )?defi\b/i],                             route: "/defi",           label: "DeFi" },
  { patterns: [/\b(go to |open |show )?governance\b/i],                       route: "/governance",     label: "Governance" },
  { patterns: [/\b(go to |open |show )?(whale|whale watch)\b/i],              route: "/whale-monitor",  label: "Whale Watch" },
  { patterns: [/\b(go to |open |show |start )?(mine|mining)\b/i],             route: "/mining",         label: "Mining" },
  { patterns: [/\b(go to |open |show )?(gaming|games?|play)\b/i],             route: "/gaming",         label: "Gaming" },
  { patterns: [/\b(go to |open |show )?tournaments?\b/i],                     route: "/tournaments",    label: "Tournaments" },
  { patterns: [/\b(go to |open |show )?(quests?|daily quests?)\b/i],          route: "/quests",         label: "Quests" },
  { patterns: [/\b(go to |open |show )?marketplace\b/i],                      route: "/marketplace",    label: "Marketplace" },
  { patterns: [/\b(go to |open |show )?subscriptions?\b/i],                   route: "/subscriptions",  label: "Subscriptions" },
  { patterns: [/\b(go to |open |show )?charity\b/i],                          route: "/charity",        label: "Charity" },
  { patterns: [/\b(go to |open |show )?achievements?\b/i],                    route: "/achievements",   label: "Achievements" },
  { patterns: [/\b(go to |open |show )?(sky school|school|learn)\b/i],        route: "/sky-school",     label: "Sky School" },
  { patterns: [/\b(go to |open |show )?(ai brain|brain)\b/i],                 route: "/ai-brain",       label: "AI Brain" },
  { patterns: [/\b(go to |open |show )?(ai agent|agent)\b/i],                 route: "/ai-agent",       label: "AI Agent" },
  { patterns: [/\b(go to |open |show )?(hope ai|hope)\b/i],                   route: "/hope-ai",        label: "HOPE AI" },
  { patterns: [/\b(go to |open |show )?(ai tools?|tools?)\b/i],               route: "/ai-tools",       label: "AI Tools" },
  { patterns: [/\b(go to |open |show )?(analytics|stats)\b/i],                route: "/analytics",      label: "Analytics" },
  { patterns: [/\b(go to |open |show )?(dashboard|my dashboard)\b/i],         route: "/dashboard",      label: "Dashboard" },
  { patterns: [/\b(go to |open |show )?ecosystem\b/i],                        route: "/ecosystem",      label: "Ecosystem" },
  { patterns: [/\b(go to |open |show )?(investor|invest)\b/i],                route: "/investor",       label: "Investor Room" },
  { patterns: [/\b(go to |open |show )?(ico|launchpad)\b/i],                  route: "/ico",            label: "ICO Launchpad" },
  { patterns: [/\b(go to |open |show )?settings?\b/i],                        route: "/settings",       label: "Settings" },
  { patterns: [/\b(go to |open |show )?security\b/i],                         route: "/security",       label: "Security" },
  { patterns: [/\b(go to |open |show )?(profile|my profile)\b/i],             route: "/profile",        label: "Profile" },
  { patterns: [/\b(go to |open |show )?(notifications?|alerts?)\b/i],         route: "/notifications",  label: "Notifications" },
  { patterns: [/\b(go to |open |show )?(search|find)\b/i],                    route: "/search",         label: "Search" },
  { patterns: [/\b(go to |open |show )?(home|homepage|landing)\b/i],          route: "/home",           label: "Home" },
  { patterns: [/\b(switch to |show )?discover( mode)?\b/i],                   action: "mode:discover",  label: "Discover Mode" },
  { patterns: [/\b(switch to |show )?execute( mode)?\b/i],                    action: "mode:execute",   label: "Execute Mode" },
  { patterns: [/\b(switch to |show )?identity( mode)?\b/i],                   action: "mode:identity",  label: "Identity Mode" },
  { patterns: [/\bgo back\b|\bback\b|\bprevious page\b/i],                    action: "nav:back",       label: "Go Back" },
  { patterns: [/\bgo forward\b|\bforward\b/i],                                action: "nav:forward",    label: "Go Forward" },
  { patterns: [/\bscroll down\b|\bpage down\b/i],                             action: "scroll:down",    label: "Scroll Down" },
  { patterns: [/\bscroll up\b|\bpage up\b|\btop\b/i],                         action: "scroll:up",      label: "Scroll Up" },
  { patterns: [/\brefresh\b|\breload\b/i],                                     action: "nav:refresh",    label: "Refresh" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
export type VoiceStatus = "starting" | "listening" | "processing" | "restarting" | "denied";

export interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  lastCommandLabel: string | null;
  supported: boolean;
  muted: boolean;
}

// ─── Module-level singleton ───────────────────────────────────────────────────
let _rec: SpeechRecognitionInstance | null = null;
let _started = false;
let _muted = true; // starts MUTED — user must click unmute
let _restartTimer: ReturnType<typeof setTimeout> | null = null;
let _errorCount = 0;
// Callbacks registered by the hook
let _onStatus: ((s: VoiceStatus) => void) = () => {};
let _onTranscript: ((t: string) => void) = () => {};
let _onCommand: ((label: string, raw: string) => void) = () => {};
let _onMuted: ((m: boolean) => void) = () => {};
let _navigate: (path: string) => void = () => {};
let _setMode: (m: string) => void = () => {};
let _toggleShell: () => void = () => {};
let _shell: string = "os";

function parseIntent(text: string) {
  const t = text.trim().toLowerCase();
  for (const intent of INTENT_MAP) {
    for (const p of intent.patterns) {
      if (p.test(t)) return intent;
    }
  }
  return null;
}

function scheduleRestart(delayMs: number) {
  if (_restartTimer) clearTimeout(_restartTimer);
  _restartTimer = setTimeout(() => {
    if (!_muted) startEngine();
  }, delayMs);
}

function stopEngine() {
  if (_restartTimer) { clearTimeout(_restartTimer); _restartTimer = null; }
  if (_rec) {
    _rec.onstart = null;
    _rec.onend = null;
    _rec.onresult = null;
    _rec.onerror = null;
    try { _rec.abort(); } catch {}
    _rec = null;
  }
}

function startEngine() {
  if (_muted) return; // Safety guard
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return;

  // Tear down stale instance
  stopEngine();

  const rec = new SR() as SpeechRecognitionInstance;
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";
  rec.maxAlternatives = 1;
  _rec = rec;

  rec.onstart = () => {
    _errorCount = 0;
    _onStatus("listening");
  };

  rec.onresult = (e: SpeechRecognitionResultEvent) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    const display = (final || interim).trim();
    if (display) _onTranscript(display);

    if (final.trim()) {
      const intent = parseIntent(final);
      if (intent) {
        _onStatus("processing");
        _onCommand(intent.label, final.trim());
        if (intent.route) {
          _navigate(intent.route);
        } else if (intent.action) {
          switch (intent.action) {
            case "mode:discover": _setMode("discover"); break;
            case "mode:execute":  _setMode("execute");  break;
            case "mode:identity": _setMode("identity"); break;
            case "nav:back":      window.history.back();   break;
            case "nav:forward":   window.history.forward(); break;
            case "nav:refresh":   window.location.reload(); break;
            case "scroll:down":   window.scrollBy({ top: 400, behavior: "smooth" }); break;
            case "scroll:up":     window.scrollTo({ top: 0, behavior: "smooth" });   break;
          }
        }
        setTimeout(() => _onStatus("listening"), 1000);
      }
    }
  };

  rec.onerror = (e: SpeechRecognitionErrEvent) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      _onStatus("denied");
      return;
    }
    if (e.error === "no-speech") return;
    _errorCount++;
    const delay = Math.min(300 * Math.pow(1.8, Math.min(_errorCount, 6)), 10000);
    _onStatus("restarting");
    scheduleRestart(delay);
  };

  rec.onend = () => {
    if (_muted) return; // Don't restart when muted
    const delay = _errorCount > 0 ? Math.min(500 * _errorCount, 5000) : 200;
    _onStatus("restarting");
    scheduleRestart(delay);
  };

  try {
    rec.start();
    _onStatus("starting");
  } catch {
    scheduleRestart(500);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGlobalVoiceEngine(): [VoiceState] {
  const [, navigate] = useLocation();
  const { setMode, toggleShell, shell } = useAppStore();

  const [state, setState] = useState<VoiceState>({
    status: "restarting", // starts muted/idle
    transcript: "",
    lastCommandLabel: null,
    muted: true,
    supported: typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
  });

  // Keep module-level callbacks pointing at latest closures
  _navigate = navigate;
  _setMode = setMode as (m: string) => void;
  _toggleShell = toggleShell;
  _shell = shell;

  _onStatus = (status: VoiceStatus) =>
    setState(s => ({ ...s, status }));

  _onTranscript = (transcript: string) =>
    setState(s => ({ ...s, transcript }));

  _onCommand = (label: string, raw: string) =>
    setState(s => ({ ...s, lastCommandLabel: label, transcript: raw }));

  _onMuted = (muted: boolean) =>
    setState(s => ({ ...s, muted }));

  useEffect(() => {
    if (_started) return;
    _started = true;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setState(s => ({ ...s, supported: false }));
      return;
    }

    // Listen for mute toggle events dispatched by AlwaysOnVoice
    const handleMuteToggle = (e: Event) => {
      const { muted } = (e as CustomEvent<{ muted: boolean }>).detail;
      _muted = muted;
      _onMuted(muted);
      if (muted) {
        stopEngine();
        _onStatus("restarting");
        _onTranscript("");
      } else {
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then(() => startEngine())
          .catch(() => startEngine());
      }
    };

    window.addEventListener("voice-mute-toggle", handleMuteToggle);

    // Starts muted — do NOT call startEngine() here
    return () => {
      window.removeEventListener("voice-mute-toggle", handleMuteToggle);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [state];
}
