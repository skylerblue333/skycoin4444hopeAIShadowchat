import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, GraduationCap, Mail, Users, Coins, Bell, Lightbulb } from "lucide-react";
import { GOLD, SectionLoading, ErrorState } from "./shared";

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

export function TodaySection() {
  const [withSuggestions, setWithSuggestions] = useState(false);
  const { data, isLoading, error } = trpc.hopeIntelligence.missionControl.today.useQuery({ withSuggestions });

  if (isLoading) return <SectionLoading label="Assembling your day…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back, <span style={{ color: GOLD }}>{data.greetingName}</span>
        </h2>
        <p className="text-white/50 text-sm mt-1">Your ecosystem at a glance — grounded in real activity across HOPE AI.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat icon={<Target className="h-3.5 w-3.5" />} label="Open Goals" value={data.goals.length} />
        <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="Active Missions" value={data.activeMissions.length} />
        <Stat icon={<GraduationCap className="h-3.5 w-3.5" />} label="Learning" value={data.learning.length} />
        <Stat icon={<Mail className="h-3.5 w-3.5" />} label="Unread DMs" value={data.unreadMessages} />
        <Stat icon={<Users className="h-3.5 w-3.5" />} label="Communities" value={data.communities} />
        <Stat icon={<Coins className="h-3.5 w-3.5" />} label="Revenue" value={data.revenue.toLocaleString()} />
      </div>

      {/* AI next-best-actions (opt-in LLM call) */}
      <Card className="border-white/10 bg-gradient-to-br from-amber-500/[0.06] to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Lightbulb className="h-4 w-4" style={{ color: GOLD }} />
            HOPE Suggestions
          </CardTitle>
          {!withSuggestions && (
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10" onClick={() => setWithSuggestions(true)}>
              Generate
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!withSuggestions ? (
            <p className="text-sm text-white/40">Ask HOPE to suggest your next best actions for today.</p>
          ) : data.suggestions.length === 0 ? (
            <p className="text-sm text-white/40">No suggestions right now — add a goal or mission to get tailored guidance.</p>
          ) : (
            <ul className="space-y-2">
              {data.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="mt-0.5 text-xs font-bold" style={{ color: GOLD }}>{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Goals */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader><CardTitle className="text-white text-base">Active Goals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.goals.length === 0 ? (
              <p className="text-sm text-white/40">No open goals. Tell HOPE what you're working toward.</p>
            ) : data.goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <span className="text-sm text-white/80">{g.title}</span>
                <Badge variant="outline" className="border-white/20 text-white/60 text-xs">{g.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top opportunities */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader><CardTitle className="text-white text-base">Top Opportunity Matches</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.topOpportunities.length === 0 ? (
              <p className="text-sm text-white/40">Refresh matches in the Opportunities tab.</p>
            ) : data.topOpportunities.map((m) => (
              <div key={m.id} className="rounded-lg border border-white/10 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/90 font-medium">{m.opportunity?.title ?? "Opportunity"}</span>
                  <Badge style={{ backgroundColor: GOLD, color: "#000" }} className="text-xs">{m.score}</Badge>
                </div>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{m.reasoning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reputation summary */}
      {data.reputation && (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-white text-base">Reputation</CardTitle>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: GOLD }}>{data.reputation.overall}</span>
              <span className="text-white/40 text-sm">/100</span>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {([["Learning", data.reputation.learning], ["Builder", data.reputation.builder], ["Teaching", data.reputation.teaching], ["Community", data.reputation.community], ["Trust", data.reputation.trust]] as const).map(([label, v]) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-white/50"><span>{label}</span><span className="tabular-nums">{v}</span></div>
                <Progress value={v} className="h-1.5 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Network suggestions */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white text-base"><Bell className="h-4 w-4" style={{ color: GOLD }} />People You Should Know</CardTitle></CardHeader>
        <CardContent>
          {data.networkSuggestions.length === 0 ? (
            <p className="text-sm text-white/40">Follow a few people and we'll surface second-degree connections.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.networkSuggestions.map((n) => (
                <div key={n.userId} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-1 pr-3 py-1">
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70 overflow-hidden">
                    {n.avatar ? <img src={n.avatar} alt="" className="h-full w-full object-cover" /> : (n.name ?? n.username ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80">{n.name ?? n.username ?? `User ${n.userId}`}</span>
                  <span className="text-xs text-white/40">· {n.mutualCount} mutual</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
