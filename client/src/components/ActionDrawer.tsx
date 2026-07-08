/**
 * ActionDrawer — The Core UX Innovation
 * Replaces all menus with a single action surface inside chat.
 * Pay | Tip | Request | Hire AI | Create Listing | Swap | Stake
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  ArrowUpRight, ArrowDownLeft, Heart, ShoppingBag, Bot,
  ArrowLeftRight, Layers, Star, X, Zap, CheckCircle, Wallet
} from "lucide-react";
import { ACTION_TYPES, type ActionType, type ParsedIntent } from "@/core/actions/actionTypes";

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedIntent?: ParsedIntent | null;
  recipientUsername?: string;
}

const QUICK_ACTIONS: Array<{
  type: ActionType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
}> = [
  { type: ACTION_TYPES.PAYMENT, label: "Send SKY", icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-500/10" },
  { type: ACTION_TYPES.TIP, label: "Tip", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
  { type: ACTION_TYPES.REQUEST_SERVICE, label: "Request", icon: ArrowDownLeft, color: "text-green-400", bg: "bg-green-500/10" },
  { type: ACTION_TYPES.CREATE_LISTING, label: "List Item", icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/10", href: "/marketplace" },
  { type: ACTION_TYPES.CALL_AI_AGENT, label: "Hire AI", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10", href: "/ai-engineer" },
  { type: ACTION_TYPES.SWAP_TOKEN, label: "Swap", icon: ArrowLeftRight, color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/token-swap" },
  { type: ACTION_TYPES.STAKE_TOKEN, label: "Stake", icon: Layers, color: "text-orange-400", bg: "bg-orange-500/10", href: "/staking" },
  { type: ACTION_TYPES.SUBSCRIBE, label: "Subscribe", icon: Star, color: "text-yellow-300", bg: "bg-yellow-400/10" },
];

export function ActionDrawer({ isOpen, onClose, preselectedIntent, recipientUsername }: ActionDrawerProps) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(
    preselectedIntent?.type ?? null
  );
  const [amount, setAmount] = useState(
    (preselectedIntent?.payload as any)?.amount?.toString() ?? ""
  );
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "done">(
    preselectedIntent && preselectedIntent.type !== ACTION_TYPES.PLAIN_TEXT ? "confirm" : "select"
  );

  const sendTx = trpc.wallet.send.useMutation({
    onSuccess: (data) => {
      setStep("done");
      toast.success("Transaction sent!", {
        description: `TX: ${(data as any)?.txHash?.slice(0, 16)}...`,
      });
    },
    onError: (err) => toast.error("Transaction failed", { description: err.message }),
  });

  if (!isOpen) return null;

  const handleActionSelect = (type: ActionType, href?: string) => {
    if (href) { onClose(); return; }
    setActiveAction(type);
    setStep("confirm");
  };

  const handleExecute = () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error("Enter a valid amount");
      return;
    }
    sendTx.mutate({
      to: recipientUsername || "platform",
      amount: Number(amount),
      token: "SKY444",
      description: note || `${activeAction} via ShadowChat`,
    });
  };

  const getActionLabel = (type: ActionType) =>
    QUICK_ACTIONS.find((a) => a.type === type)?.label ?? type;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-background border border-border/50 rounded-t-2xl p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 200ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {step === "select" ? "Quick Actions" : step === "done" ? "Done!" : getActionLabel(activeAction!)}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "select" && (
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) =>
              action.href ? (
                <Link key={action.type} href={action.href} onClick={onClose}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl ${action.bg} hover:opacity-80 transition-opacity cursor-pointer`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </Link>
              ) : (
                <button key={action.type} onClick={() => handleActionSelect(action.type)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl ${action.bg} hover:opacity-80 transition-opacity`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </button>
              )
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {recipientUsername && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  {recipientUsername[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">@{recipientUsername}</div>
                  <div className="text-xs text-muted-foreground">Recipient</div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount (SKY)</label>
              <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2.5">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className="flex-1 bg-transparent outline-none text-lg font-bold" autoFocus />
                <span className="text-sm text-muted-foreground font-medium">SKY</span>
              </div>
              {amount && <div className="text-xs text-muted-foreground mt-1">≈ ${(Number(amount) * 0.042).toFixed(2)} USD</div>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note (optional)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?" className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-sm outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("select")}
                className="flex-1 py-3 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-medium transition-colors">
                Back
              </button>
              <button onClick={handleExecute} disabled={sendTx.isPending || !amount}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {sendTx.isPending ? "Sending..." : `Confirm ${getActionLabel(activeAction!)}`}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="font-bold text-lg mb-1">Transaction Complete!</h4>
            <p className="text-sm text-muted-foreground mb-4">{amount} SKY sent successfully</p>
            <button onClick={onClose}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
