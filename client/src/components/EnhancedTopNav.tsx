import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart, BarChart3, Building2, Briefcase, FileText, Users, Megaphone,
  BookOpen, Headphones, Code2, Zap, DollarSign, Plane, Heart, Home, Gamepad2,
  Settings, Smartphone, Plug, Lock, Brain, Wallet, Menu, X
} from "lucide-react";

const navCategories = [
  {
    label: "E-Commerce",
    icon: ShoppingCart,
    items: [
      { label: "Product Catalog", path: "/productcatalog" },
      { label: "Shopping Cart", path: "/shoppingcart" },
      { label: "Checkout", path: "/checkout" },
      { label: "Order Tracking", path: "/ordertracking" },
      { label: "Marketplace", path: "/marketplace" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    items: [
      { label: "Dashboard Overview", path: "/dashboardoverview" },
      { label: "Sales Analytics", path: "/salesanalytics" },
      { label: "Custom Reports", path: "/customreports" },
      { label: "Performance Metrics", path: "/performancemetrics" },
    ],
  },
  {
    label: "Enterprise",
    icon: Building2,
    items: [
      { label: "User Directory", path: "/userdirectory" },
      { label: "Access Control", path: "/accesscontrol" },
      { label: "Audit Log", path: "/auditlog" },
      { label: "Compliance", path: "/compliancedashboard" },
    ],
  },
  {
    label: "Projects",
    icon: Briefcase,
    items: [
      { label: "Project Board", path: "/projectboard" },
      { label: "Gantt Chart", path: "/ganttchart" },
      { label: "Task List", path: "/tasklist" },
      { label: "Time Tracking", path: "/timetracking" },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    items: [
      { label: "Blog Editor", path: "/blogeditor" },
      { label: "Media Gallery", path: "/mediagallery" },
      { label: "Video Upload", path: "/videouploader" },
      { label: "Publishing", path: "/publishingschedule" },
    ],
  },
  {
    label: "Community",
    icon: Users,
    items: [
      { label: "Community Hub", path: "/communityhub" },
      { label: "Forums", path: "/forumcategories" },
      { label: "Events", path: "/eventcalendar" },
      { label: "Groups", path: "/groupdirectory" },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      { label: "Campaign Builder", path: "/campaignbuilder" },
      { label: "Email Campaigns", path: "/emailcampaigns" },
      { label: "Analytics", path: "/campaignanalytics" },
      { label: "A/B Testing", path: "/abtesting" },
    ],
  },
  {
    label: "Learning",
    icon: BookOpen,
    items: [
      { label: "Course Builder", path: "/coursebuilder" },
      { label: "Lessons", path: "/lessoneditor" },
      { label: "Quizzes", path: "/quizbuilder" },
      { label: "Certificates", path: "/certificatemanager" },
    ],
  },
  {
    label: "Support",
    icon: Headphones,
    items: [
      { label: "Ticket Queue", path: "/ticketqueue" },
      { label: "Knowledge Base", path: "/knowledgebase" },
      { label: "Live Chat", path: "/livechat" },
      { label: "FAQ", path: "/faqmanagement" },
    ],
  },
  {
    label: "Developer",
    icon: Code2,
    items: [
      { label: "API Docs", path: "/apidocumentation" },
      { label: "API Testing", path: "/apitesting" },
      { label: "Webhooks", path: "/webhookmanager" },
      { label: "SDK Download", path: "/sdkdownload" },
    ],
  },
  {
    label: "Finance",
    icon: DollarSign,
    items: [
      { label: "Portfolio", path: "/portfoliooverview" },
      { label: "Trading", path: "/trading" },
      { label: "Budget Planner", path: "/budgetplanner" },
      { label: "Investments", path: "/stocksearch" },
    ],
  },
  {
    label: "Blockchain",
    icon: Zap,
    items: [
      { label: "Smart Contracts", path: "/smartcontracts" },
      { label: "NFT Gallery", path: "/nftgallery" },
      { label: "DAO Governance", path: "/daogovernance" },
      { label: "Staking", path: "/stakingdashboard" },
    ],
  },
  {
    label: "Travel",
    icon: Plane,
    items: [
      { label: "Destinations", path: "/destinationguide" },
      { label: "Trip Planner", path: "/tripplanner" },
      { label: "Flights", path: "/flightsearch" },
      { label: "Hotels", path: "/hotelsearch" },
    ],
  },
  {
    label: "Health",
    icon: Heart,
    items: [
      { label: "Health Dashboard", path: "/healthdashboard" },
      { label: "Activity Tracking", path: "/activitytracking" },
      { label: "Nutrition", path: "/nutritiontracker" },
      { label: "Sleep Tracking", path: "/sleeptracking" },
    ],
  },
  {
    label: "Real Estate",
    icon: Home,
    items: [
      { label: "Properties", path: "/propertylisting" },
      { label: "Virtual Tours", path: "/virtualtour" },
      { label: "Mortgage Calc", path: "/mortgagecalculator" },
      { label: "Offers", path: "/offermanagement" },
    ],
  },
  {
    label: "Gaming",
    icon: Gamepad2,
    items: [
      { label: "Game Lobby", path: "/gamelobby" },
      { label: "Leaderboards", path: "/leaderboards" },
      { label: "Tournaments", path: "/tournaments" },
      { label: "Achievements", path: "/achievements" },
    ],
  },
  {
    label: "Mobile",
    icon: Smartphone,
    items: [
      { label: "Mobile Home", path: "/mobilehome" },
      { label: "Mobile Menu", path: "/mobilemenu" },
      { label: "Mobile Settings", path: "/mobilesettings" },
      { label: "Mobile Wallet", path: "/mobilewallet" },
    ],
  },
  {
    label: "Integrations",
    icon: Plug,
    items: [
      { label: "Slack", path: "/slackintegration" },
      { label: "Discord", path: "/discordintegration" },
      { label: "Webhooks", path: "/webhookmanager" },
      { label: "API Keys", path: "/apikeys" },
    ],
  },
  {
    label: "Compliance",
    icon: Lock,
    items: [
      { label: "Terms of Service", path: "/termsofservice" },
      { label: "Privacy Policy", path: "/privacypolicy" },
      { label: "GDPR", path: "/gdpr" },
      { label: "Audit Trail", path: "/audittrail" },
    ],
  },
  {
    label: "AI & ML",
    icon: Brain,
    items: [
      { label: "AI Assistant", path: "/aiassistant" },
      { label: "ML Models", path: "/mlmodels" },
      { label: "Predictions", path: "/predictiveanalytics" },
      { label: "Recommendations", path: "/recommendations" },
    ],
  },
];

export function EnhancedTopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-lg hover:opacity-80">
              <Zap className="w-6 h-6 text-primary" />
              <span className="hidden sm:inline">SKYCOIN4444</span>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto flex-1">
            {navCategories.map((category) => {
              const Icon = category.icon;
              return (
                <DropdownMenu key={category.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 whitespace-nowrap text-xs"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>{category.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {category.items.map((item) => (
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
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <a>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </a>
            </Link>
            <Link href="/profile">
              <a>
                <Button variant="outline" size="sm" className="text-xs">
                  Profile
                </Button>
              </a>
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 grid grid-cols-2 gap-2">
            {navCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.label} href={category.items[0].path}>
                  <a className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-secondary text-xs">
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
