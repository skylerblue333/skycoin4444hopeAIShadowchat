import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, BookOpen, Award, BarChart3, Users, Star,
  ChevronRight, ChevronDown, Menu, X, Home, Zap, Trophy,
  Play, CheckCircle2, Lock, Clock, Search, Bell
} from "lucide-react";

const SCHOOL_NAV = [
  {
    label: "Dashboard",
    href: "/school/dashboard",
    icon: BarChart3,
    badge: null,
  },
  {
    label: "My Courses",
    href: "/school",
    icon: BookOpen,
    badge: "3 active",
  },
  {
    label: "Browse Catalog",
    href: "/school",
    icon: Search,
    badge: null,
  },
  {
    label: "Certificates",
    href: "/school/certificate/1",
    icon: Award,
    badge: "2 earned",
  },
  {
    label: "Leaderboard",
    href: "/school/dashboard",
    icon: Trophy,
    badge: null,
  },
  {
    label: "Community",
    href: "/communities",
    icon: Users,
    badge: null,
  },
];

const ACTIVE_COURSES = [
  { title: "Blockchain Fundamentals", progress: 68, slug: "blockchain-fundamentals", emoji: "🔗", xp: 1240 },
  { title: "DeFi Mastery", progress: 24, slug: "defi-mastery", emoji: "💎", xp: 480 },
  { title: "Solidity Smart Contracts", progress: 5, slug: "solidity-smart-contracts", emoji: "⚡", xp: 100 },
];

interface SchoolLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function SchoolLayout({ children, title, breadcrumbs }: SchoolLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coursesExpanded, setCoursesExpanded] = useState(true);

  const totalXP = ACTIVE_COURSES.reduce((s, c) => s + c.xp, 0);
  const level = Math.floor(totalXP / 1000) + 1;
  const levelProgress = (totalXP % 1000) / 10;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card/50 border-r border-border/50 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* School Header */}
        <div className="p-4 border-b border-border/50">
          <Link href="/school">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 border border-primary/30 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm group-hover:text-primary transition-colors">Sky School</p>
                <p className="text-xs text-muted-foreground">Learn & Earn</p>
              </div>
            </div>
          </Link>
        </div>

        {/* XP / Level */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{level}</div>
              <span className="text-xs font-semibold">Level {level}</span>
            </div>
            <span className="text-xs text-yellow-400 font-mono flex items-center gap-1">
              <Zap className="h-3 w-3" />{totalXP.toLocaleString()} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">{1000 - (totalXP % 1000)} XP to Level {level + 1}</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {SCHOOL_NAV.map(item => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.label} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-card/80 hover:text-foreground"}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-mono">{item.badge}</span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Active Courses */}
          <div className="pt-2">
            <button onClick={() => setCoursesExpanded(p => !p)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              <Play className="h-3 w-3" />
              Active Courses
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${coursesExpanded ? "rotate-180" : ""}`} />
            </button>
            {coursesExpanded && (
              <div className="space-y-1 mt-1">
                {ACTIVE_COURSES.map(course => (
                  <Link key={course.slug} href={`/school/course/${course.slug}`}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-card/80 cursor-pointer transition-all group">
                      <span className="text-base shrink-0">{course.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{course.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Progress value={course.progress} className="h-1 flex-1" />
                          <span className="text-xs text-muted-foreground font-mono">{course.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom CTA */}
        <div className="p-4 border-t border-border/50">
          <Link href="/school">
            <Button className="w-full bg-primary text-primary-foreground gap-2 text-sm">
              <BookOpen className="h-4 w-4" />Browse All Courses
            </Button>
          </Link>
          <Link href="/">
            <div className="flex items-center gap-2 mt-3 px-2 py-1.5 rounded-lg hover:bg-card/50 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span className="text-xs">Back to Platform</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-card/50 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <Link href="/school">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />Sky School
              </span>
            </Link>
            {breadcrumbs?.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                {b.href ? (
                  <Link href={b.href}><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{b.label}</span></Link>
                ) : (
                  <span className="text-foreground font-medium truncate">{b.label}</span>
                )}
              </span>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-card/50 transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{totalXP.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
