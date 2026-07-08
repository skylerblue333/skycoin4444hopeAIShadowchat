/**
 * ASSEMBLY PUZZLE GAME — TIS-100 / Shenzhen I/O Style
 * ═══════════════════════════════════════════════════════════════
 * Write low-level assembly-like code to solve computational puzzles.
 * Each solved puzzle earns SKY444 tokens.
 */
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, RotateCcw, ChevronRight, Cpu, Terminal, Trophy, Zap, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Instruction Set ──────────────────────────────────────────
type Register = "ACC" | "BAK" | "NIL";
type Instruction =
  | { op: "MOV"; src: string; dst: string }
  | { op: "ADD"; val: string }
  | { op: "SUB"; val: string }
  | { op: "MUL"; val: string }
  | { op: "NEG" }
  | { op: "JMP"; label: string }
  | { op: "JEZ"; label: string }
  | { op: "JNZ"; label: string }
  | { op: "JGZ"; label: string }
  | { op: "JLZ"; label: string }
  | { op: "SAV" }
  | { op: "SWP" }
  | { op: "NOP" }
  | { op: "OUT"; val: string };

interface CPUState {
  acc: number;
  bak: number;
  pc: number;
  output: number[];
  steps: number;
  halted: boolean;
  error: string | null;
}

// ── Puzzle Definitions ───────────────────────────────────────
interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  reward: number;
  inputs: number[];
  expectedOutputs: number[];
  starterCode: string;
  hint: string;
  maxSteps: number;
}

const PUZZLES: Puzzle[] = [
  {
    id: "p1",
    title: "Signal Passthrough",
    description: "Read each value from IN and write it to OUT unchanged.",
    difficulty: "easy",
    reward: 50,
    inputs: [4, 7, 2, 9, 1],
    expectedOutputs: [4, 7, 2, 9, 1],
    starterCode: `; Read from IN, write to OUT\n; IN contains: 4, 7, 2, 9, 1\nLOOP:\n  MOV IN ACC\n  MOV ACC OUT\n  JMP LOOP`,
    hint: "MOV IN ACC reads the next input. MOV ACC OUT writes to output.",
    maxSteps: 50,
  },
  {
    id: "p2",
    title: "Signal Amplifier",
    description: "Multiply each input value by 2 and output the result.",
    difficulty: "easy",
    reward: 75,
    inputs: [3, 5, 8, 2, 6],
    expectedOutputs: [6, 10, 16, 4, 12],
    starterCode: `; Multiply each input by 2\nLOOP:\n  MOV IN ACC\n  ADD ACC\n  MOV ACC OUT\n  JMP LOOP`,
    hint: "ADD ACC adds ACC to itself, effectively doubling it.",
    maxSteps: 60,
  },
  {
    id: "p3",
    title: "Signal Inverter",
    description: "Output the negative of each input value.",
    difficulty: "easy",
    reward: 75,
    inputs: [5, -3, 8, -1, 4],
    expectedOutputs: [-5, 3, -8, 1, -4],
    starterCode: `; Negate each input\nLOOP:\n  MOV IN ACC\n  NEG\n  MOV ACC OUT\n  JMP LOOP`,
    hint: "NEG negates the value in ACC.",
    maxSteps: 50,
  },
  {
    id: "p4",
    title: "Sequence Sorter",
    description: "Output only positive values from the input stream.",
    difficulty: "medium",
    reward: 150,
    inputs: [3, -2, 7, -5, 1, -8, 4],
    expectedOutputs: [3, 7, 1, 4],
    starterCode: `; Filter: output only positive values\nLOOP:\n  MOV IN ACC\n  JLZ SKIP\n  JEZ SKIP\n  MOV ACC OUT\nSKIP:\n  JMP LOOP`,
    hint: "JLZ jumps if ACC < 0. JEZ jumps if ACC == 0.",
    maxSteps: 100,
  },
  {
    id: "p5",
    title: "Running Sum",
    description: "Output the running sum of all inputs.",
    difficulty: "medium",
    reward: 200,
    inputs: [1, 2, 3, 4, 5],
    expectedOutputs: [1, 3, 6, 10, 15],
    starterCode: `; Running sum\nMOV 0 ACC\nLOOP:\n  ADD IN\n  MOV ACC OUT\n  JMP LOOP`,
    hint: "Keep a running total in ACC. ADD IN adds the next input to ACC.",
    maxSteps: 80,
  },
  {
    id: "p6",
    title: "Fibonacci Generator",
    description: "Output the first 8 Fibonacci numbers starting from 1.",
    difficulty: "hard",
    reward: 400,
    inputs: [],
    expectedOutputs: [1, 1, 2, 3, 5, 8, 13, 21],
    starterCode: `; Generate Fibonacci sequence\nMOV 1 ACC\nMOV ACC OUT\nMOV 1 BAK\nLOOP:\n  SAV\n  ADD BAK\n  MOV ACC OUT\n  SWP\n  JMP LOOP`,
    hint: "SAV saves ACC to BAK. SWP swaps ACC and BAK.",
    maxSteps: 200,
  },
  {
    id: "p7",
    title: "Absolute Value",
    description: "Output the absolute value of each input.",
    difficulty: "medium",
    reward: 175,
    inputs: [-4, 7, -2, 0, -9, 3],
    expectedOutputs: [4, 7, 2, 0, 9, 3],
    starterCode: `; Absolute value\nLOOP:\n  MOV IN ACC\n  JGZ OUTPUT\n  JEZ OUTPUT\n  NEG\nOUTPUT:\n  MOV ACC OUT\n  JMP LOOP`,
    hint: "If ACC > 0 or == 0, output directly. Otherwise negate first.",
    maxSteps: 100,
  },
  {
    id: "p8",
    title: "Countdown",
    description: "Given N, output N, N-1, N-2, ... 1, 0.",
    difficulty: "hard",
    reward: 350,
    inputs: [5],
    expectedOutputs: [5, 4, 3, 2, 1, 0],
    starterCode: `; Countdown from N to 0\nMOV IN ACC\nLOOP:\n  MOV ACC OUT\n  JEZ DONE\n  SUB 1\n  JMP LOOP\nDONE:\n  NOP`,
    hint: "SUB 1 decrements ACC. JEZ stops when ACC reaches 0.",
    maxSteps: 100,
  },
];

// ── Simple Assembly Interpreter ──────────────────────────────
function parseProgram(code: string): { instructions: any[]; labels: Map<string, number> } {
  const lines = code.split("\n").map(l => l.replace(/;.*$/, "").trim()).filter(Boolean);
  const labels = new Map<string, number>();
  const instructions: any[] = [];

  for (const line of lines) {
    if (line.endsWith(":")) {
      labels.set(line.slice(0, -1).toUpperCase(), instructions.length);
    } else {
      const parts = line.split(/\s+/);
      instructions.push(parts);
    }
  }
  return { instructions, labels };
}

function runProgram(
  code: string,
  inputs: number[],
  maxSteps: number
): { output: number[]; steps: number; error: string | null } {
  const { instructions, labels } = parseProgram(code);
  let acc = 0;
  let bak = 0;
  let pc = 0;
  let inputIdx = 0;
  const output: number[] = [];
  let steps = 0;

  const resolveVal = (v: string): number => {
    if (v === "ACC") return acc;
    if (v === "BAK") return bak;
    if (v === "IN") {
      if (inputIdx >= inputs.length) return 0;
      return inputs[inputIdx++];
    }
    const n = parseInt(v, 10);
    if (isNaN(n)) throw new Error(`Unknown value: ${v}`);
    return n;
  };

  while (pc < instructions.length && steps < maxSteps) {
    const instr = instructions[pc];
    const op = instr[0]?.toUpperCase();
    steps++;

    try {
      switch (op) {
        case "MOV": {
          const val = resolveVal(instr[1]);
          const dst = instr[2]?.toUpperCase();
          if (dst === "ACC") acc = val;
          else if (dst === "BAK") bak = val;
          else if (dst === "OUT") output.push(val);
          break;
        }
        case "ADD": acc = acc + resolveVal(instr[1]); break;
        case "SUB": acc = acc - resolveVal(instr[1]); break;
        case "MUL": acc = acc * resolveVal(instr[1]); break;
        case "NEG": acc = -acc; break;
        case "SAV": bak = acc; break;
        case "SWP": { const t = acc; acc = bak; bak = t; break; }
        case "NOP": break;
        case "JMP": {
          const lbl = instr[1]?.toUpperCase();
          if (labels.has(lbl)) { pc = labels.get(lbl)! - 1; }
          break;
        }
        case "JEZ": if (acc === 0) { const lbl = instr[1]?.toUpperCase(); if (labels.has(lbl)) pc = labels.get(lbl)! - 1; } break;
        case "JNZ": if (acc !== 0) { const lbl = instr[1]?.toUpperCase(); if (labels.has(lbl)) pc = labels.get(lbl)! - 1; } break;
        case "JGZ": if (acc > 0) { const lbl = instr[1]?.toUpperCase(); if (labels.has(lbl)) pc = labels.get(lbl)! - 1; } break;
        case "JLZ": if (acc < 0) { const lbl = instr[1]?.toUpperCase(); if (labels.has(lbl)) pc = labels.get(lbl)! - 1; } break;
        default: throw new Error(`Unknown instruction: ${op}`);
      }
    } catch (e) {
      return { output, steps, error: e instanceof Error ? e.message : "Runtime error" };
    }
    pc++;
  }

  return { output, steps, error: null };
}

// ── Component ────────────────────────────────────────────────
const DIFFICULTY_COLORS = {
  easy: "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  hard: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  extreme: "text-red-400 bg-red-500/10 border-red-500/20",
};

export function AssemblyPuzzle({ onRewardEarned }: { onRewardEarned?: (amount: number) => void }) {
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [code, setCode] = useState(PUZZLES[0].starterCode);
  const [result, setResult] = useState<{ output: number[]; steps: number; error: string | null; passed: boolean } | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectPuzzle = (p: Puzzle) => {
    setSelectedPuzzle(p);
    setCode(p.starterCode);
    setResult(null);
    setShowHint(false);
  };

  const runCode = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      try {
        const { output, steps, error } = runProgram(code, selectedPuzzle.inputs, selectedPuzzle.maxSteps);
        const passed = !error &&
          output.length === selectedPuzzle.expectedOutputs.length &&
          output.every((v, i) => v === selectedPuzzle.expectedOutputs[i]);

        setResult({ output, steps, error, passed });

        if (passed && !solved.has(selectedPuzzle.id)) {
          setSolved(prev => new Set([...prev, selectedPuzzle.id]));
          toast.success(`🏆 Puzzle solved! +${selectedPuzzle.reward} SKY444 earned!`, { duration: 4000 });
          onRewardEarned?.(selectedPuzzle.reward);
        } else if (passed) {
          toast.success("✅ Correct! (Already solved)");
        } else if (error) {
          toast.error(`❌ Runtime error: ${error}`);
        } else {
          toast.error("❌ Output doesn't match expected values");
        }
      } catch (e) {
        setResult({ output: [], steps: 0, error: e instanceof Error ? e.message : "Parse error", passed: false });
      }
      setRunning(false);
    }, 300);
  }, [code, selectedPuzzle, solved, onRewardEarned]);

  const reset = () => {
    setCode(selectedPuzzle.starterCode);
    setResult(null);
  };

  const totalReward = PUZZLES.filter(p => solved.has(p.id)).reduce((s, p) => s + p.reward, 0);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_160)]/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[oklch(0.7_0.2_160)]" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Assembly Puzzles</h2>
            <p className="text-xs text-muted-foreground">TIS-100 style — write assembly to solve computational challenges</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[oklch(0.7_0.2_160)] border-[oklch(0.7_0.2_160)]/30">
            <Trophy className="w-3 h-3 mr-1" />
            {solved.size}/{PUZZLES.length} solved
          </Badge>
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            <Zap className="w-3 h-3 mr-1" />
            {totalReward} SKY444
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Puzzle List */}
        <div className="col-span-3 space-y-1 overflow-y-auto">
          {PUZZLES.map(p => (
            <button
              key={p.id}
              onClick={() => selectPuzzle(p)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                selectedPuzzle.id === p.id
                  ? "border-[oklch(0.7_0.2_160)]/50 bg-[oklch(0.7_0.2_160)]/10"
                  : "border-border/30 hover:border-border/60 hover:bg-secondary/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold truncate">{p.title}</span>
                {solved.has(p.id) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono", DIFFICULTY_COLORS[p.difficulty])}>
                  {p.difficulty}
                </span>
                <span className="text-[10px] text-yellow-400 font-mono">+{p.reward}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Editor + Output */}
        <div className="col-span-9 flex flex-col gap-3 min-h-0">
          {/* Puzzle Info */}
          <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{selectedPuzzle.title}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono", DIFFICULTY_COLORS[selectedPuzzle.difficulty])}>
                {selectedPuzzle.difficulty}
              </span>
              <span className="text-[10px] text-yellow-400 ml-auto font-mono">+{selectedPuzzle.reward} SKY444</span>
            </div>
            <p className="text-xs text-muted-foreground">{selectedPuzzle.description}</p>
            {selectedPuzzle.inputs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Input: [{selectedPuzzle.inputs.join(", ")}] → Expected: [{selectedPuzzle.expectedOutputs.join(", ")}]
              </p>
            )}
            {selectedPuzzle.inputs.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                No input stream → Expected: [{selectedPuzzle.expectedOutputs.join(", ")}]
              </p>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-[10px] px-2 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30"
              >
                {showHint ? "Hide hint" : "Hint"}
              </button>
            </div>
            {showHint && (
              <div className="absolute top-8 right-2 z-10 w-64 p-3 rounded-lg bg-background border border-[oklch(0.7_0.2_160)]/30 shadow-xl text-xs text-muted-foreground">
                💡 {selectedPuzzle.hint}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full h-full min-h-[200px] font-mono text-xs bg-[#0a0f0a] text-[oklch(0.85_0.1_160)] border border-border/30 rounded-lg p-4 resize-none focus:outline-none focus:border-[oklch(0.7_0.2_160)]/50 leading-relaxed"
              spellCheck={false}
              placeholder="; Write your assembly code here..."
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={runCode}
              disabled={running}
              className="bg-[oklch(0.7_0.2_160)] hover:bg-[oklch(0.65_0.2_160)] text-black font-bold"
            >
              {running ? (
                <><span className="animate-spin mr-2">⚙</span>Running...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Run</>
              )}
            </Button>
            <Button variant="outline" onClick={reset} size="sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            {result && (
              <div className="flex items-center gap-3 ml-2">
                <span className={cn("text-xs font-mono", result.passed ? "text-green-400" : "text-red-400")}>
                  {result.passed ? "✅ PASS" : "❌ FAIL"}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{result.steps} steps</span>
                {result.output.length > 0 && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Output: [{result.output.slice(0, 8).join(", ")}{result.output.length > 8 ? "..." : ""}]
                  </span>
                )}
                {result.error && (
                  <span className="text-xs text-red-400 font-mono">{result.error}</span>
                )}
              </div>
            )}
          </div>

          {/* Instruction Reference */}
          <div className="p-3 rounded-lg bg-secondary/10 border border-border/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Instruction Set</p>
            <div className="grid grid-cols-4 gap-x-4 gap-y-0.5">
              {[
                ["MOV src dst", "Move value"],
                ["ADD val", "ACC += val"],
                ["SUB val", "ACC -= val"],
                ["MUL val", "ACC *= val"],
                ["NEG", "ACC = -ACC"],
                ["SAV", "BAK = ACC"],
                ["SWP", "Swap ACC/BAK"],
                ["JMP lbl", "Jump"],
                ["JEZ lbl", "Jump if ACC=0"],
                ["JNZ lbl", "Jump if ACC≠0"],
                ["JGZ lbl", "Jump if ACC>0"],
                ["JLZ lbl", "Jump if ACC<0"],
                ["IN", "Next input"],
                ["OUT", "Write output"],
                ["NOP", "No operation"],
              ].map(([instr, desc]) => (
                <div key={instr} className="flex gap-1.5 items-baseline">
                  <code className="text-[10px] text-[oklch(0.7_0.2_160)] font-mono shrink-0">{instr}</code>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
