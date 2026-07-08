/**
 * IdentityMode — OS Shell: Identity Mode
 * Profile + Trust Score + Wallet + Social Graph
 * Old /profile + /wallet data in the new OS interface
 */
import { Link } from "wouter";
import { Shield, Wallet, Users, Star, TrendingUp, Award, Settings, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAppStore } from "@/shared/state/appStore";

const TRUST_FACTORS = [
  { label: "Payment History", score: 95, icon: "💳" },
  { label: "Content Quality", score: 88, icon: "✍️" },
  { label: "Community Reports", score: 100, icon: "🛡️" },
  { label: "Transaction Success", score: 92, icon: "✅" },
  { label: "AI Interactions", score: 85, icon: "🤖" },
];

export function IdentityMode() {
  const { user } = useAuth();
  const { setMode } = useAppStore();
  const { data: walletData } = trpc.wallet.getBalance.useQuery();
  const { data: meData } = trpc.auth.me.useQuery();

  const balance = (walletData as any)?.balance ?? 0;
  const trustScore = (meData as any)?.trustScore ?? 87;
  const followers = (meData as any)?.followersCount ?? 0;
  const following = (meData as any)?.followingCount ?? 0;

  const trustColor = trustScore >= 90 ? "text-green-400" : trustScore >= 70 ? "text-yellow-400" : "text-red-400";
  const trustBg = trustScore >= 90 ? "bg-green-500/20 border-green-500/30" : trustScore >= 70 ? "bg-yellow-500/20 border-yellow-500/30" : "bg-red-500/20 border-red-500/30";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Profile header */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{user?.name ?? "User"}</h2>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${trustBg} ${trustColor}`}>
                  <Shield className="w-3 h-3" />
                  Trust {trustScore}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email ?? ""}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center">
                  <div className="font-bold text-sm">{followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{following}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-green-400">${balance.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              </div>
            </div>
            <Link href="/settings">
              <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground">
                <Settings className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Trust score breakdown */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold">Trust Score Breakdown</span>
            <span className={`ml-auto text-lg font-black ${trustColor}`}>{trustScore}/100</span>
          </div>
          <div className="space-y-2">
            {TRUST_FACTORS.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-xs text-muted-foreground flex-1">{f.label}</span>
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${f.score}%` }} />
                </div>
                <span className="text-xs font-medium w-8 text-right">{f.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet summary */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold">Wallet</span>
            <Link href="/wallet" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
              Full view <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">${balance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">$0.00</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-purple-400">$0.00</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { useAppStore.getState().setMode("execute"); useAppStore.getState().setPendingActionText("I want to pay "); }}
              className="flex-1 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors">
              Send Payment
            </button>
            <button
              onClick={() => { useAppStore.getState().setMode("execute"); useAppStore.getState().setPendingActionText("Send a tip to "); }}
              className="flex-1 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors">
              Send Tip
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/profile", icon: Users, label: "Full Profile", color: "text-purple-400" },
            { href: "/creator-analytics", icon: TrendingUp, label: "Creator Stats", color: "text-cyan-400" },
            { href: "/leaderboards", icon: Star, label: "Leaderboard", color: "text-yellow-400" },
            { href: "/achievements", icon: Award, label: "Achievements", color: "text-green-400" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="card p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
