// SKYCOIN4444 Design System - Unified across all 349 pages
export const DESIGN_SYSTEM = {
  // Color Palette
  colors: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      900: "#082f49",
    },
    accent: {
      cyan: "#06b6d4",
      purple: "#a855f7",
      pink: "#ec4899",
      orange: "#f97316",
      green: "#22c55e",
      blue: "#3b82f6",
    },
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712",
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    gradients: {
      primary: "linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)",
      secondary: "linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)",
      tertiary: "linear-gradient(135deg, #f97316 0%, #22c55e 100%)",
      dark: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      mono: "'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // Spacing
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "6rem",
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },

  // Shadows
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    glow: "0 0 20px rgba(6, 182, 212, 0.5)",
    "glow-purple": "0 0 20px rgba(168, 85, 247, 0.5)",
  },

  // Transitions
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
    notification: 1090,
  },

  // Breakpoints
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Component Sizes
  componentSizes: {
    button: {
      xs: "1.5rem",
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
      xl: "3.5rem",
    },
    input: {
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
    },
    avatar: {
      xs: "1.5rem",
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
      xl: "4rem",
    },
  },

  // Animation Presets
  animations: {
    fadeIn: "fadeIn 300ms ease-in-out",
    slideInUp: "slideInUp 300ms ease-out",
    slideInDown: "slideInDown 300ms ease-out",
    slideInLeft: "slideInLeft 300ms ease-out",
    slideInRight: "slideInRight 300ms ease-out",
    scaleIn: "scaleIn 300ms ease-out",
    bounce: "bounce 1s infinite",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },

  // Gamification Colors
  gamification: {
    xp: "#fbbf24",
    sky4: "#06b6d4",
    trophy: "#f59e0b",
    streak: "#ef4444",
    achievement: "#a855f7",
    level: "#10b981",
  },
};

// Theme Variants
export const THEME_VARIANTS = {
  dark: {
    bg: {
      primary: "#0f172a",
      secondary: "#1e293b",
      tertiary: "#334155",
      overlay: "rgba(15, 23, 42, 0.8)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#cbd5e1",
      tertiary: "#94a3b8",
    },
    border: "#334155",
  },
  light: {
    bg: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      tertiary: "#e2e8f0",
      overlay: "rgba(255, 255, 255, 0.8)",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      tertiary: "#94a3b8",
    },
    border: "#e2e8f0",
  },
};

// Responsive Utilities
export const RESPONSIVE = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  gridCols: {
    auto: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    twoCol: "grid-cols-1 md:grid-cols-2",
    threeCol: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
};

// Component Presets
export const COMPONENT_PRESETS = {
  card: {
    base: "bg-slate-900/50 border border-slate-800 rounded-lg",
    hover: "hover:border-cyan-500/50 hover:shadow-lg transition-all",
    interactive: "cursor-pointer hover:bg-slate-800/50",
  },
  button: {
    base: "inline-flex items-center justify-center font-medium rounded-lg transition-all",
    primary: "bg-cyan-600 hover:bg-cyan-700 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white",
    ghost: "hover:bg-slate-800/50 text-slate-300",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  },
  input: {
    base: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all",
  },
  badge: {
    base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    primary: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    error: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
};

export default DESIGN_SYSTEM;
