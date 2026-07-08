import { useState } from "react";
import { Button } from "@/components/ui/button";

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function colorOf(n: number) { return n === 0 ? "green" : RED.has(n) ? "red" : "black"; }

export default function Roulette({ onEnd }: { onEnd: (score: number, result: string) => void }) {
  const [bet, setBet] = useState<"red" | "black" | "green" | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  function spin() {
    if (!bet) return;
    setSpinning(true); setMsg("");
    let ticks = 0;
    const interval = setInterval(() => {
      setResult(Math.floor((Math.random()) * 37));
      ticks++;
      if (ticks > 20) {
        clearInterval(interval);
        const final = Math.floor((Math.random()) * 37);
        setResult(final);
        const c = colorOf(final);
        const win = c === bet;
        const score = win ? (bet === "green" ? 350 : 100) : 0;
        const m = `${final} ${c.toUpperCase()} — ${win ? "You win!" : "House wins"}`;
        setMsg(m); setSpinning(false);
        onEnd(score, m);
      }
    }, 80);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center font-display font-black text-4xl border-4 ${
          result === null ? "border-border text-muted-foreground" :
          colorOf(result) === "red" ? "border-red-500 text-red-400 bg-red-500/10" :
          colorOf(result) === "black" ? "border-zinc-500 text-zinc-200 bg-zinc-700/30" :
          "border-emerald-500 text-emerald-400 bg-emerald-500/10"
        } ${spinning ? "animate-spin" : ""}`}>
          {result ?? "?"}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {(["red", "black", "green"] as const).map(c => (
          <button key={c} onClick={() => setBet(c)} disabled={spinning}
            className={`px-5 py-2 rounded-lg font-medium capitalize transition-all ${bet === c ? "ring-2 ring-[var(--neon-cyan)]" : ""} ${
              c === "red" ? "bg-red-600/70" : c === "black" ? "bg-zinc-700/70" : "bg-emerald-600/70"}`}>
            {c} {c === "green" ? "(35x)" : "(2x)"}
          </button>
        ))}
      </div>
      {msg && <div className="text-center font-heading font-bold text-lg neon-text">{msg}</div>}
      <div className="flex justify-center">
        <Button onClick={spin} disabled={!bet || spinning} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">
          {spinning ? "Spinning…" : "Spin"}
        </Button>
      </div>
    </div>
  );
}
