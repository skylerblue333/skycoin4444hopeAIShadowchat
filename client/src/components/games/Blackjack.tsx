import { useState } from "react";
import { Button } from "@/components/ui/button";

type Card = { rank: string; suit: string; value: number };
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS: [string, number][] = [
  ["A", 11], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["6", 6], ["7", 7],
  ["8", 8], ["9", 9], ["10", 10], ["J", 10], ["Q", 10], ["K", 10],
];

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const [rank, value] of RANKS) deck.push({ rank, suit: s, value });
  return deck.sort(() => (Math.random()) - 0.5);
}
function handValue(cards: Card[]): number {
  let total = cards.reduce((a, c) => a + c.value, 0);
  let aces = cards.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function CardView({ c, hidden }: { c?: Card; hidden?: boolean }) {
  if (hidden || !c) return <div className="w-12 h-16 rounded-md bg-[var(--neon-purple)]/30 border border-border" />;
  const red = c.suit === "♥" || c.suit === "♦";
  return (
    <div className={`w-12 h-16 rounded-md bg-white flex flex-col items-center justify-center font-bold ${red ? "text-red-600" : "text-black"}`}>
      <span className="text-sm">{c.rank}</span><span>{c.suit}</span>
    </div>
  );
}

export default function Blackjack({ onEnd }: { onEnd: (score: number, result: string) => void }) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<"idle" | "player" | "done">("idle");
  const [msg, setMsg] = useState("");

  function deal() {
    const d = makeDeck();
    const p = [d.pop()!, d.pop()!];
    const dl = [d.pop()!, d.pop()!];
    setDeck(d); setPlayer(p); setDealer(dl); setPhase("player"); setMsg("");
  }
  function hit() {
    const d = [...deck]; const p = [...player, d.pop()!];
    setDeck(d); setPlayer(p);
    if (handValue(p) > 21) finish(p, dealer, "bust");
  }
  function stand() {
    const d = [...deck]; const dl = [...dealer];
    while (handValue(dl) < 17) dl.push(d.pop()!);
    setDeck(d); setDealer(dl); finish(player, dl, "stand");
  }
  function finish(p: Card[], dl: Card[], reason: string) {
    const pv = handValue(p), dv = handValue(dl);
    let result: string; let score: number;
    if (reason === "bust" || pv > 21) { result = "Bust — Dealer wins"; score = 0; }
    else if (dv > 21 || pv > dv) { result = "You win!"; score = pv === 21 ? 150 : 100; }
    else if (pv === dv) { result = "Push"; score = 25; }
    else { result = "Dealer wins"; score = 0; }
    setPhase("done"); setMsg(result); onEnd(score, result);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--neon-magenta)] mb-2">Dealer {phase === "done" ? `(${handValue(dealer)})` : ""}</div>
        <div className="flex gap-2">{dealer.map((c, i) => <CardView key={i} c={c} hidden={phase === "player" && i === 1} />)}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--neon-cyan)] mb-2">You {player.length > 0 ? `(${handValue(player)})` : ""}</div>
        <div className="flex gap-2">{player.map((c, i) => <CardView key={i} c={c} />)}</div>
      </div>
      {msg && <div className="font-heading font-bold text-lg neon-text">{msg}</div>}
      <div className="flex gap-2">
        {phase === "idle" && <Button onClick={deal} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">Deal</Button>}
        {phase === "player" && <>
          <Button onClick={hit} variant="outline">Hit</Button>
          <Button onClick={stand} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">Stand</Button>
        </>}
        {phase === "done" && <Button onClick={deal} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">Play again</Button>}
      </div>
    </div>
  );
}
