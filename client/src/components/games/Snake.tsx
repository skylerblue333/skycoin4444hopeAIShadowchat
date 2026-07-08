import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

const SIZE = 16;
const CELL = 18;

type Pt = { x: number; y: number };

export default function Snake({ onEnd }: { onEnd: (score: number, result: string) => void }) {
  const [snake, setSnake] = useState<Pt[]>([{ x: 8, y: 8 }]);
  const [food, setFood] = useState<Pt>({ x: 4, y: 4 });
  const [dir, setDir] = useState<Pt>({ x: 1, y: 0 });
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const dirRef = useRef(dir);
  dirRef.current = dir;
  const endedRef = useRef(false);

  const reset = useCallback(() => {
    setSnake([{ x: 8, y: 8 }]); setFood({ x: 4, y: 4 }); setDir({ x: 1, y: 0 });
    setScore(0); endedRef.current = false; setRunning(true);
  }, []);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      const d = dirRef.current;
      if (e.key === "ArrowUp" && d.y === 0) setDir({ x: 0, y: -1 });
      else if (e.key === "ArrowDown" && d.y === 0) setDir({ x: 0, y: 1 });
      else if (e.key === "ArrowLeft" && d.x === 0) setDir({ x: -1, y: 0 });
      else if (e.key === "ArrowRight" && d.x === 0) setDir({ x: 1, y: 0 });
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setSnake(prev => {
        const head = { x: prev[0].x + dirRef.current.x, y: prev[0].y + dirRef.current.y };
        if (head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE || prev.some(p => p.x === head.x && p.y === head.y)) {
          setRunning(false);
          if (!endedRef.current) { endedRef.current = true; onEnd(score * 10, `Game over — score ${score}`); }
          return prev;
        }
        const next = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 1);
          setFood({ x: Math.floor((Math.random()) * SIZE), y: Math.floor((Math.random()) * SIZE) });
        } else next.pop();
        return next;
      });
    }, 130);
    return () => clearInterval(iv);
  }, [running, food, score, onEnd]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">Score: <span className="text-[var(--neon-cyan)] font-bold">{score}</span> · Use arrow keys</div>
      <div className="relative grid-bg rounded-lg border border-border" style={{ width: SIZE * CELL, height: SIZE * CELL }}>
        {snake.map((p, i) => (
          <div key={i} className="absolute rounded-sm" style={{
            left: p.x * CELL, top: p.y * CELL, width: CELL - 2, height: CELL - 2,
            background: i === 0 ? "var(--neon-cyan)" : "var(--neon-purple)",
            boxShadow: i === 0 ? "0 0 8px var(--neon-cyan)" : "none",
          }} />
        ))}
        <div className="absolute rounded-full animate-pulse-glow" style={{
          left: food.x * CELL, top: food.y * CELL, width: CELL - 2, height: CELL - 2,
          background: "var(--neon-magenta)", boxShadow: "0 0 8px var(--neon-magenta)",
        }} />
      </div>
      <Button onClick={reset} className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] text-background">
        {running ? "Restart" : "Start"}
      </Button>
    </div>
  );
}
