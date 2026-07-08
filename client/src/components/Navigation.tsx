import { Button } from "@/components/ui/button";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "💰 Finance", href: "/walletoverview" },
    { label: "🛍️ Marketplace", href: "/marketplace" },
    { label: "👥 Social", href: "/social" },
    { label: "🎮 Gaming", href: "/gamelobby" },
    { label: "🎬 Content", href: "/streaming" },
    { label: "🤖 AI", href: "/aiassistant" },
    { label: "🎓 Learn", href: "/school" },
    { label: "⚙️ Admin", href: "/admindashboard" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">
              SKY4444
            </a>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-purple-500/20 rounded transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white hidden md:inline-flex">
                Dashboard
              </Button>
            </Link>
            <button
              className="lg:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-500/20 bg-black/50 backdrop-blur p-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-purple-500/20 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              </Link>
            ))}
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white mt-4">
                Dashboard
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
