import { useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";

const DEMO_STORIES = [
  { id: 1, username: "skyler.blue", avatar: "SB", gradient: "from-violet-500 to-purple-600", viewed: false },
  { id: 2, username: "crypto_king", avatar: "CK", gradient: "from-sky-400 to-blue-600", viewed: false },
  { id: 3, username: "defi_queen", avatar: "DQ", gradient: "from-pink-500 to-rose-600", viewed: true },
  { id: 4, username: "nft_wizard", avatar: "NW", gradient: "from-amber-400 to-orange-500", viewed: false },
  { id: 5, username: "web3_dev", avatar: "WD", gradient: "from-emerald-400 to-green-600", viewed: true },
  { id: 6, username: "sky_trader", avatar: "ST", gradient: "from-cyan-400 to-teal-600", viewed: false },
];

export function StoriesBar() {
  const [viewed, setViewed] = useState<Set<number>>(new Set());

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {/* Add Story */}
      <Link href="/social">
        <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 hover:bg-muted/60 transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">Your Story</span>
        </div>
      </Link>

      {/* Stories */}
      {DEMO_STORIES.map((story) => {
        const isViewed = viewed.has(story.id);
        return (
          <div
            key={story.id}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
            onClick={() => setViewed(prev => new Set([...prev, story.id]))}
          >
            <div className={`w-14 h-14 rounded-full p-0.5 ${isViewed ? "bg-muted" : `bg-gradient-to-br ${story.gradient}`}`}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <span className="text-xs font-bold">{story.avatar}</span>
              </div>
            </div>
            <span className={`text-xs whitespace-nowrap max-w-[56px] truncate ${isViewed ? "text-muted-foreground" : "text-foreground"}`}>
              {story.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
