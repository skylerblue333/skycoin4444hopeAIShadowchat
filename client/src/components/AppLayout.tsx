import { Link } from "wouter";
// Navigation component removed - use DashboardLayout instead
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { VoiceCommandBar } from "@/components/VoiceCommandBar";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExternalLink, GitBranch, Smartphone, Puzzle, Code2, Globe, Shield, Mic, Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation handled by parent layout */}

      {/* Main Content */}
      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 relative overflow-hidden">
        {/* Tie-dye gradient accent bar */}
        <div className="h-1 w-full gradient-tiedye-animated" />

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl gradient-psychedelic flex items-center justify-center shadow-lg" style={{ boxShadow: "var(--shadow-glow-purple)" }}>
                  <span className="text-white font-black text-sm font-mono">S4</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-black text-base text-gradient">
                    SKYCOIN4444
                  </span>
                  <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Shadowchat Platform</span>
                </div>
              </div>
              <p className="text-sm text-white/50 mb-4 leading-relaxed max-w-xs">
                A fully integrated AI-powered Web3 social ecosystem. One platform. One vision. Unlimited potential.
              </p>
              <p className="text-xs text-white/30 italic mb-4">
                Built by Skyler Blue Spillers — AI mines for me 24/7
              </p>
              <div className="flex flex-wrap gap-2">
                {["Web3", "AI-Powered", "Open Source", "Decentralized"].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-mono">{t}</span>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-bold text-sm mb-3 text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Platform
              </h4>
              <div className="space-y-2">
                {[
                  ["/ecosystem", "Ecosystem"],
                  ["/staking", "Staking"],
                  ["/trading", "AI Trading"],
                  ["/marketplace", "Marketplace"],
                  ["/ai-engineer", "AI Engineer"],
                  ["/school", "SkySchool"],
                  ["/arcade", "Arcade"],
                  ["/hope-ai", "Hope AI"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="block text-sm text-white/40 hover:text-white transition-colors hover:translate-x-1 duration-150">{label}</Link>
                ))}
              </div>
            </div>

            {/* Privacy & Dev */}
            <div>
              <h4 className="font-bold text-sm mb-3 text-white/80 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Privacy & Dev
              </h4>
              <div className="space-y-2">
                {[
                  ["/privacy-vault", "Privacy Vault"],
                  ["/ghost-mode", "Ghost Mode"],
                  ["/shadow-relay", "Shadow Relay"],
                  ["/tor-bridge", "Tor Bridge"],
                  ["/anti-surveillance", "Anti-Surveillance"],
                  ["/voice-commands", "Voice Commands"],
                  ["/embed-sdk", "Embed SDK"],
                  ["/developer-protocol", "Dev Protocol"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="block text-sm text-white/40 hover:text-white transition-colors hover:translate-x-1 duration-150">{label}</Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-sm mb-3 text-white/80 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-green-400" /> Resources
              </h4>
              <div className="space-y-2">
                <Link href="/mobile-app" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <Smartphone className="h-3 w-3" /> Mobile App
                </Link>
                <Link href="/browser-extension" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <Puzzle className="h-3 w-3" /> Browser Extension
                </Link>
                <Link href="/proof-vault" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <Shield className="h-3 w-3" /> Proof Vault
                </Link>
                <a href="https://skycoin4444-izajymrg.manus.space" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <ExternalLink className="h-3 w-3" /> Live Demo
                </a>
                <a href="https://github.com/skylerblue333/Final-intergation-shadowchat-" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <GitBranch className="h-3 w-3" /> GitHub (Final)
                </a>
                <a href="https://github.com/skylerblue333/Skycoin-done-444-fix" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <GitBranch className="h-3 w-3" /> GitHub (Prod)
                </a>
                <a href="https://drive.google.com/file/d/1HKXHGjYNu2FUa41b4aiPelf75ThRZ_Za/view?usp=drivesdk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <ExternalLink className="h-3 w-3" /> Download ZIP
                </a>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              &copy; 2024–2027 SKYCOIN4444 / Shadowchat. All rights reserved. Built by Skyler Blue Spillers.
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-white/20 font-mono">
                SKY444 &middot; ICO: Apr 24, 2027 &middot; 212,986+ lines &middot; 966+ screens &middot; 305+ endpoints
              </p>
              <div className="flex items-center gap-1 text-xs text-purple-400 font-mono">
                <Mic className="w-3 h-3" />
                <span>Voice-Ready</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <VoiceCommandBar onLogout={logout} />
      <MobileBottomNav />
    </div>
  );
}
