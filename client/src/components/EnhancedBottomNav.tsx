import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Home, Compass, ShoppingCart, Users, User, MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const bottomNavItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Shop", icon: ShoppingCart, path: "/marketplace" },
  { label: "Community", icon: Users, path: "/communityhub" },
  { label: "Profile", icon: User, path: "/profile" },
];

const moreItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Wallet", path: "/wallet" },
  { label: "Trading", path: "/trading" },
  { label: "Gaming", path: "/gamelobby" },
  { label: "Streaming", path: "/streaming" },
  { label: "Social", path: "/social" },
  { label: "Settings", path: "/settings" },
  { label: "Help", path: "/helpcenter" },
];

export function EnhancedBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-between px-2 py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <a className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </a>
            </Link>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-20">
            <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moreItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a>
                  <DropdownMenuItem className="cursor-pointer text-xs">
                    {item.label}
                  </DropdownMenuItem>
                </a>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
