/**
 * ThemeSwitcher — uses ThemeContext as the single source of truth.
 * Supports dark / light / cyber themes.
 * The `cyber` theme is applied as a CSS class on top of `dark`.
 */
import { useEffect } from "react";
import { Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type AppTheme = "dark" | "light" | "cyber";

const THEMES: { id: AppTheme; label: string; icon: typeof Sun; preview: string }[] = [
  { id: "dark",  label: "Dark",  icon: Moon, preview: "bg-zinc-900" },
  { id: "light", label: "Light", icon: Sun,  preview: "bg-zinc-100" },
  { id: "cyber", label: "Cyber", icon: Zap,  preview: "bg-violet-950" },
];

/** Apply cyber accent on top of the dark class already managed by ThemeContext */
function applyCyberAccent(enable: boolean) {
  const root = document.documentElement;
  if (enable) {
    root.classList.add("cyber");
    root.style.setProperty("--primary", "270 100% 70%");
  } else {
    root.classList.remove("cyber");
    root.style.removeProperty("--primary");
  }
}

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  // Read extended theme (cyber) from localStorage
  const storedExt = typeof window !== "undefined" ? localStorage.getItem("app-theme-ext") : null;
  const isCyber = storedExt === "cyber";

  // Sync cyber accent on mount
  useEffect(() => {
    applyCyberAccent(isCyber);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTheme: AppTheme = isCyber ? "cyber" : (theme as AppTheme);

  const handleApply = (t: AppTheme) => {
    if (t === "cyber") {
      // Cyber = dark base + cyber accent
      if (theme === "light" && toggleTheme) toggleTheme(); // switch to dark first
      applyCyberAccent(true);
      localStorage.setItem("app-theme-ext", "cyber");
    } else {
      applyCyberAccent(false);
      localStorage.removeItem("app-theme-ext");
      if (t === "light" && theme === "dark" && toggleTheme) toggleTheme();
      if (t === "dark" && theme === "light" && toggleTheme) toggleTheme();
    }
    // Dispatch for any legacy listeners
    window.dispatchEvent(new CustomEvent("theme-change", { detail: t }));
  };

  if (!switchable) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {THEMES.map((th) => {
          const Icon = th.icon;
          return (
            <button
              key={th.id}
              onClick={() => handleApply(th.id)}
              title={th.label}
              className={`p-1.5 rounded-md transition-colors ${
                currentTheme === th.id
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {THEMES.map((th) => {
        const Icon = th.icon;
        return (
          <button
            key={th.id}
            onClick={() => handleApply(th.id)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
              currentTheme === th.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground/50"
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${th.preview} border border-border`} />
            <div className="flex items-center gap-1">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{th.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Legacy export for any code that calls applyTheme directly */
export function applyTheme(t: AppTheme) {
  const root = document.documentElement;
  if (t === "light") {
    root.classList.remove("dark", "cyber");
    root.classList.add("light");
    root.style.removeProperty("--primary");
  } else if (t === "cyber") {
    root.classList.remove("light");
    root.classList.add("dark", "cyber");
    root.style.setProperty("--primary", "270 100% 70%");
  } else {
    root.classList.remove("light", "cyber");
    root.classList.add("dark");
    root.style.removeProperty("--primary");
  }
  try { localStorage.setItem("app-theme", t); } catch {}
  window.dispatchEvent(new CustomEvent("theme-change", { detail: t }));
}
