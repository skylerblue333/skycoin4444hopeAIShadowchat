import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Loader2, Sparkles } from "lucide-react";
import { GOLD, SectionLoading, EmptyState } from "./shared";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <h4 className="text-sm font-semibold mb-2" style={{ color: GOLD }}>{title}</h4>
      {children}
    </div>
  );
}

export function StartupSection() {
  const utils = trpc.useUtils();
  const [idea, setIdea] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const list = trpc.hopeIntelligence.startup.list.useQuery();
  const detail = trpc.hopeIntelligence.startup.get.useQuery({ id: activeId! }, { enabled: activeId != null });
  const generate = trpc.hopeIntelligence.startup.generate.useMutation({
    onSuccess(d) {
      toast.success("Blueprint generated.");
      setIdea("");
      utils.hopeIntelligence.startup.list.invalidate();
      if (d.id) setActiveId(d.id);
    },
    onError(e) { toast.error(e.message); },
  });

  const bp = detail.data;
  const plan = (bp?.businessPlan ?? {}) as Record<string, unknown>;
  const branding = (bp?.branding ?? {}) as Record<string, unknown>;
  const marketing = (bp?.marketing ?? {}) as Record<string, unknown>;
  const roadmap = (bp?.mvpRoadmap ?? []) as Array<{ phase: string; items: string[] }>;
  const team = (bp?.teamPlan ?? []) as Array<{ role: string; focus: string }>;

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <div className="space-y-4">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Rocket className="h-4 w-4" style={{ color: GOLD }} />Startup Builder</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your idea in a sentence or two…" rows={4} className="bg-white/5 border-white/10 text-white" />
            <Button className="w-full" style={{ backgroundColor: GOLD, color: "#000" }} disabled={generate.isPending || idea.trim().length < 8} onClick={() => generate.mutate({ idea: idea.trim() })}>
              {generate.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Blueprint</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader><CardTitle className="text-white text-base">Your Blueprints</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {list.isLoading ? <SectionLoading /> : !list.data || list.data.length === 0 ? (
              <p className="text-sm text-white/40">No blueprints yet.</p>
            ) : list.data.map((b) => (
              <button key={b.id} onClick={() => setActiveId(b.id)} className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${activeId === b.id ? "border-amber-500/50 bg-amber-500/5" : "border-white/10 hover:bg-white/[0.04]"}`}>
                <div className="text-sm text-white/90 font-medium">{b.name ?? "Untitled"}</div>
                <div className="text-xs text-white/40 line-clamp-1">{b.idea}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        {activeId == null ? (
          <EmptyState title="Select or generate a blueprint" hint="HOPE AI turns your idea into a plan, branding, marketing, an MVP roadmap, and a team plan." />
        ) : detail.isLoading ? <SectionLoading label="Loading blueprint…" /> : bp ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-white">{bp.name}</h3>
              {bp.tagline && <p className="text-white/50">{bp.tagline}</p>}
            </div>
            {Object.keys(plan).length > 0 && (
              <Block title="Business Plan">
                <dl className="space-y-1.5">
                  {Object.entries(plan).map(([k, v]) => (
                    <div key={k} className="text-sm">
                      <dt className="text-white/50 capitalize">{k.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="text-white/80">{typeof v === "string" ? v : JSON.stringify(v)}</dd>
                    </div>
                  ))}
                </dl>
              </Block>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.keys(branding).length > 0 && (
                <Block title="Branding">
                  <ul className="space-y-1 text-sm text-white/80">
                    {Object.entries(branding).map(([k, v]) => <li key={k}><span className="text-white/50 capitalize">{k}:</span> {typeof v === "string" ? v : JSON.stringify(v)}</li>)}
                  </ul>
                </Block>
              )}
              {Object.keys(marketing).length > 0 && (
                <Block title="Marketing">
                  <ul className="space-y-1 text-sm text-white/80">
                    {Object.entries(marketing).map(([k, v]) => <li key={k}><span className="text-white/50 capitalize">{k}:</span> {Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : JSON.stringify(v)}</li>)}
                  </ul>
                </Block>
              )}
            </div>
            {roadmap.length > 0 && (
              <Block title="MVP Roadmap">
                <div className="space-y-2">
                  {roadmap.map((r, i) => (
                    <div key={i}>
                      <Badge variant="outline" className="border-white/20 text-white/70 text-xs mb-1">{r.phase}</Badge>
                      <ul className="list-disc list-inside text-sm text-white/70">{r.items?.map((it, j) => <li key={j}>{it}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </Block>
            )}
            {team.length > 0 && (
              <Block title="Team Plan">
                <ul className="space-y-1 text-sm text-white/80">
                  {team.map((t, i) => <li key={i}><span className="font-medium" style={{ color: GOLD }}>{t.role}:</span> {t.focus}</li>)}
                </ul>
              </Block>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
