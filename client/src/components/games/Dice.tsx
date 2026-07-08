import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

const ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function Dice({ onEnd }: { onEnd: (score: number, result: string) => void }) {
  const [prediction, setPrediction] = useState<"high" | "low" | null>(null);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [msg, setMsg] = useState("");

  function roll() {
    if (!prediction) return;
    setRolling(true); setMsg("");
    let ticks = 0;
    const iv = setInterval(() => {
      setDice([Math.floor((Math.random())*6), Math.floor((Math.random())*6)]);
      ticks++;
      if (ticks > 12) {
        clearInterval(iv);
        const a = Math.floor((Math.random())*6), b = Math.floor((Math.random())*6);
        setDice([a, b]);
        const sum = a + b + 2;
        const isHigh = sum >= 7;
        const win = (prediction === "high" && isHigh) || (prediction === "low" && !isHigh);
        const score = win ? 100 : 0;
        const m = `Rolled ${sum} — ${win ? "You win!" : "You lose"}`;
        setMsg(m); setRolling(false); onEnd(score, m);
      }
    }, 90);
  }

  const [A, B] = dice;
  const IconA = ICONS[A], IconB = ICONS[B];

  return (
    <div className="space-y-5 flex flex-col items-center">
      <div className="flex gap-4">
        <IconA className={`w-20 h-20 text-[var(--neon-cyan)] ${rolling ? "animate-spin" : ""}`} />
        <IconB className={`w-20 h-20 text-[var(--neon-magenta)] ${rolling ? "animate-spin" : ""}`} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setPrediction("low")} disabled={rolling}
          className={`px-5 py-2 rounded-lg glass ${prediction === "low" ? "ring-2 ring-[var(--neon-cyan)]" : ""}`}>Low (2–6)</button>
        <button onClick={() => setPrediction("high")} disabled={rolling}
          className={`px-5 py-2 rounded-lg glass ${prediction === "high" ? "ring-2 ring-[var(--neon-magenta)]" : ""}`}>High (7–12)</button>
      </div>
      {msg && <div className="font-heading font-bold text-lg neon-text">{msg}</div>}
      <Button onClick={roll} disabled={!prediction || rolling} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">
        {rolling ? "Rolling…" : "Roll dice"}
      </Button>
    </div>
  );
}
