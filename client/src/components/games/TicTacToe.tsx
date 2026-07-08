import { useState } from "react";
import { Button } from "@/components/ui/button";

type Cell = "X" | "O" | null;
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function winner(b: Cell[]): Cell | "draw" | null {
  for (const [a,c,d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? "draw" : null;
}
// Minimax AI (plays as O)
function bestMove(b: Cell[]): number {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) if (!b[i]) {
    const nb = [...b]; nb[i] = "O";
    const score = minimax(nb, false);
    if (score > best) { best = score; move = i; }
  }
  return move;
}
function minimax(b: Cell[], maxing: boolean): number {
  const w = winner(b);
  if (w === "O") return 10; if (w === "X") return -10; if (w === "draw") return 0;
  if (maxing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) if (!b[i]) { const nb=[...b]; nb[i]="O"; best=Math.max(best,minimax(nb,false)); }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) if (!b[i]) { const nb=[...b]; nb[i]="X"; best=Math.min(best,minimax(nb,true)); }
    return best;
  }
}

export default function TicTacToe({ onEnd }: { onEnd: (score: number, result: string) => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  function play(i: number) {
    if (board[i] || done) return;
    const nb = [...board]; nb[i] = "X";
    let w = winner(nb);
    if (!w) { const m = bestMove(nb); if (m >= 0) nb[m] = "O"; w = winner(nb); }
    setBoard(nb);
    if (w) {
      const result = w === "X" ? "You win!" : w === "O" ? "AI wins" : "Draw";
      const score = w === "X" ? 200 : w === "draw" ? 50 : 0;
      setDone(true); setMsg(result); onEnd(score, result);
    }
  }
  function reset() { setBoard(Array(9).fill(null)); setDone(false); setMsg(""); }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button key={i} onClick={() => play(i)}
            className="w-20 h-20 glass rounded-lg font-display font-black text-3xl flex items-center justify-center hover:bg-secondary/40 transition-colors"
            style={{ color: c === "X" ? "var(--neon-cyan)" : "var(--neon-magenta)" }}>
            {c}
          </button>
        ))}
      </div>
      {msg && <div className="font-heading font-bold text-lg neon-text">{msg}</div>}
      <Button onClick={reset} variant="outline">New game</Button>
    </div>
  );
}
