import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BottomTabBar } from "@/components/BottomTabBar";
import MarketTicker from "@/components/MarketTicker";
import CurrencyTicker from "@/components/CurrencyTicker";
import { EnhancedNavbar } from "@/components/EnhancedNavbar";
import { Footer } from "@/components/Footer";

// Lazy load all pages
const ABTesting = lazy(() => import('./pages/ABTesting'));
const ABTestingAdvanced = lazy(() => import('./pages/ABTestingAdvanced'));
const AIAgentEconomy = lazy(() => import('./pages/AIAgentEconomy'));
const AIAgentMarket = lazy(() => import('./pages/AIAgentMarket'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AIBrain = lazy(() => import('./pages/AIBrain'));
const AICodeStudio = lazy(() => import('./pages/AICodeStudio'));
const AICopyStudio = lazy(() => import('./pages/AICopyStudio'));
const AICore = lazy(() => import('./pages/AICore'));
const AIEngineer = lazy(() => import('./pages/AIEngineer'));
const AIGovernance = lazy(() => import('./pages/AIGovernance'));
const AIMarketAgents = lazy(() => import('./pages/AIMarketAgents'));
const AIMatchmaker = lazy(() => import('./pages/AIMatchmaker'));
const AIModerationQueue = lazy(() => import('./pages/AIModerationQueue'));
const AIPersonaFeed = lazy(() => import('./pages/AIPersonaFeed'));
const AIPersonaSystem = lazy(() => import('./pages/AIPersonaSystem'));
const AIToolsHub = lazy(() => import('./pages/AIToolsHub'));
const AITrading = lazy(() => import('./pages/AITrading'));
const CryptoAIDashboard = lazy(() => import('./pages/CryptoAIDashboard'));
import { Trading as TradingPage, Portfolio as PortfolioPage, Stocks as StocksPage, Wallet as WalletPage, Mining as MiningPage, SocialFeed as SocialFeedPage, Profiles as ProfilesPage, Messaging as MessagingPage, Communities as CommunitiesPage, Games as GamesPage, Leaderboard as LeaderboardPage, Tournaments as TournamentsPage, Rewards as RewardsPage, Marketplace as MarketplacePage, MarketplaceSell as MarketplaceSellPage, Orders as OrdersPage, Auctions as AuctionsPage, Courses as CoursesPage, Tutorials as TutorialsPage, Certifications as CertificationsPage, Resources as ResourcesPage, CreatorDashboard as CreatorDashboardPage, CreatorAnalytics as CreatorAnalyticsPage, Monetization as MonetizationPage, CreatorContent as CreatorContentPage, AIBrain as AIBrainPage, AIAssistant as AIAssistantPage, AITools as AIToolsPage, AIAgents as AIAgentsPage, DevTools as DevToolsPage, Utilities as UtilitiesPage, Converters as ConvertersPage, Generators as GeneratorsPage, AdminDashboard as AdminDashboardPage, AdminUsers as AdminUsersPage, AdminSettings as AdminSettingsPage, AdminReports as AdminReportsPage } from './pages/FinancePages';
const AITrainingLoops = lazy(() => import('./pages/AITrainingLoops'));
const APIDocs = lazy(() => import('./pages/APIDocs'));
const APIDocumentation = lazy(() => import('./pages/APIDocumentation'));
const APIIntegration = lazy(() => import('./pages/APIIntegration'));
const APIKeys = lazy(() => import('./pages/APIKeys'));
const APILogs = lazy(() => import('./pages/APILogs'));
const APIManagement = lazy(() => import('./pages/APIManagement'));
const APIMonitoring = lazy(() => import('./pages/APIMonitoring'));
const APIStatus = lazy(() => import('./pages/APIStatus'));
const APITesting = lazy(() => import('./pages/APITesting'));
const APIUsage = lazy(() => import('./pages/APIUsage'));
const APIVersioning = lazy(() => import('./pages/APIVersioning'));
const APYTracking = lazy(() => import('./pages/APYTracking'));
const About = lazy(() => import('./pages/About'));
const AccessControl = lazy(() => import('./pages/AccessControl'));
const AccessibilitySettings = lazy(() => import('./pages/AccessibilitySettings'));
const AccordionNavigation = lazy(() => import('./pages/AccordionNavigation'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const AchievementBadges = lazy(() => import('./pages/AchievementBadges'));
const Achievements = lazy(() => import('./pages/Achievements'));
const ActionObjects = lazy(() => import('./pages/ActionObjects'));
const ActionPanel = lazy(() => import('./pages/ActionPanel'));
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'));
const ActivityTracking = lazy(() => import('./pages/ActivityTracking'));
const AdaptivePersonalization = lazy(() => import('./pages/AdaptivePersonalization'));
const AdaptiveRoadmap = lazy(() => import('./pages/AdaptiveRoadmap'));
const AddBankAccount = lazy(() => import('./pages/AddBankAccount'));
const AddCreditCard = lazy(() => import('./pages/AddCreditCard'));
const AddressBook = lazy(() => import('./pages/AddressBook'));
const AddressLookup = lazy(() => import('./pages/AddressLookup'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminWalletManager = lazy(() => import('./pages/AdminWalletManager'));
const AdvancedAdminPanel = lazy(() => import('./pages/AdvancedAdminPanel'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const AdvancedOrders = lazy(() => import('./pages/AdvancedOrders'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const AffiliateProgram = lazy(() => import('./pages/AffiliateProgram'));
const AgeGate = lazy(() => import('./pages/AgeGate'));
const AgeVerification = lazy(() => import('./pages/AgeVerification'));
const AgentBuilder = lazy(() => import('./pages/AgentBuilder'));
const AgentCity = lazy(() => import('./pages/AgentCity'));
const AgentCoordination = lazy(() => import('./pages/AgentCoordination'));
const AgentCoordinationHub = lazy(() => import('./pages/AgentCoordinationHub'));
const AgentDebate = lazy(() => import('./pages/AgentDebate'));
const AgentDetail = lazy(() => import('./pages/AgentDetail'));
const AgentMarketplace = lazy(() => import('./pages/AgentMarketplace'));
const AgentPerformance = lazy(() => import('./pages/AgentPerformance'));
const AgentSprint = lazy(() => import('./pages/AgentSprint'));
const AgentsDashboard = lazy(() => import('./pages/AgentsDashboard'));
const AlertConfiguration = lazy(() => import('./pages/AlertConfiguration'));
const AlertDialog = lazy(() => import('./pages/AlertDialog'));
const AlertManagement = lazy(() => import('./pages/AlertManagement'));
const AmbientFeed = lazy(() => import('./pages/AmbientFeed'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const AnalyticsProducts = lazy(() => import('./pages/AnalyticsProducts'));
const AnalyticsReports = lazy(() => import('./pages/AnalyticsReports'));
const AnomalyDetection = lazy(() => import('./pages/AnomalyDetection'));
const AntiSurveillance = lazy(() => import('./pages/AntiSurveillance'));
const ApprovalWorkflows = lazy(() => import('./pages/ApprovalWorkflows'));
const ArbitrageBot = lazy(() => import('./pages/ArbitrageBot'));
const Arcade = lazy(() => import('./pages/Arcade'));
const ArchiveManagement = lazy(() => import('./pages/ArchiveManagement'));
const AssetAllocation = lazy(() => import('./pages/AssetAllocation'));
const AssetManagement = lazy(() => import('./pages/AssetManagement'));
const AssetTracking = lazy(() => import('./pages/AssetTracking'));
const AssignmentTracker = lazy(() => import('./pages/AssignmentTracker'));
const AttributionModeling = lazy(() => import('./pages/AttributionModeling'));
const AudienceSegmentation = lazy(() => import('./pages/AudienceSegmentation'));
const AudioAnalytics = lazy(() => import('./pages/AudioAnalytics'));
const AudioEditing = lazy(() => import('./pages/AudioEditing'));
const AudioLibrary = lazy(() => import('./pages/AudioLibrary'));
const AudioPlayer = lazy(() => import('./pages/AudioPlayer'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const AutoResponder = lazy(() => import('./pages/AutoResponder'));
const AutomationEngine = lazy(() => import('./pages/AutomationEngine'));
const AutomationRules = lazy(() => import('./pages/AutomationRules'));
const AutomationWorkflows = lazy(() => import('./pages/AutomationWorkflows'));
const BackupManagement = lazy(() => import('./pages/BackupManagement'));
const Badges = lazy(() => import('./pages/Badges'));
const BanSuspendUser = lazy(() => import('./pages/BanSuspendUser'));
const BatchGeneration = lazy(() => import('./pages/BatchGeneration'));
const BattlePass = lazy(() => import('./pages/BattlePass'));
const BehavioralIntelligence = lazy(() => import('./pages/BehavioralIntelligence'));
const Beta = lazy(() => import('./pages/Beta'));
const BillingHistory = lazy(() => import('./pages/BillingHistory'));
const BlockBrowser = lazy(() => import('./pages/BlockBrowser'));
const BlockRewards = lazy(() => import('./pages/BlockRewards'));
const BlockUser = lazy(() => import('./pages/BlockUser'));
const BlockchainCustody = lazy(() => import('./pages/BlockchainCustody'));
const BlockchainMonitor = lazy(() => import('./pages/BlockchainMonitor'));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'));
const BlogEditor = lazy(() => import('./pages/BlogEditor'));
const BlogPublisher = lazy(() => import('./pages/BlogPublisher'));
const BookPage = lazy(() => import('./pages/BookPage'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const BountySystem = lazy(() => import('./pages/BountySystem'));
const BrandGuidelines = lazy(() => import('./pages/BrandGuidelines'));
const BreadcrumbNavigation = lazy(() => import('./pages/BreadcrumbNavigation'));
const BridgeProtocol = lazy(() => import('./pages/BridgeProtocol'));
const BridgeTransactions = lazy(() => import('./pages/BridgeTransactions'));
const BrowserExtension = lazy(() => import('./pages/BrowserExtension'));
const BudgetPlanner = lazy(() => import('./pages/BudgetPlanner'));
const BugReporting = lazy(() => import('./pages/BugReporting'));
const BuildOrder = lazy(() => import('./pages/BuildOrder'));
const BuildRoadmap = lazy(() => import('./pages/BuildRoadmap'));
const BulkOperations = lazy(() => import('./pages/BulkOperations'));
const BulkOrdering = lazy(() => import('./pages/BulkOrdering'));
const BulkUpload = lazy(() => import('./pages/BulkUpload'));
const CCPA = lazy(() => import('./pages/CCPA'));
const CDNManagement = lazy(() => import('./pages/CDNManagement'));
const CRM = lazy(() => import('./pages/CRM'));
const CacheManagement = lazy(() => import('./pages/CacheManagement'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Calendar = lazy(() => import('./pages/Calendar'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const CampaignAnalytics = lazy(() => import('./pages/CampaignAnalytics'));
const CampaignBuilder = lazy(() => import('./pages/CampaignBuilder'));
const CampaignCreation = lazy(() => import('./pages/CampaignCreation'));
const CarRental = lazy(() => import('./pages/CarRental'));
const CardGridView = lazy(() => import('./pages/CardGridView'));
const CashFlowAnalysis = lazy(() => import('./pages/CashFlowAnalysis'));
const CategoryManagement = lazy(() => import('./pages/CategoryManagement'));
const CertificateManager = lazy(() => import('./pages/CertificateManager'));
const ChainExplorer = lazy(() => import('./pages/ChainExplorer'));
const ChangeLog = lazy(() => import('./pages/ChangeLog'));
const ChannelCustomization = lazy(() => import('./pages/ChannelCustomization'));
const Charity = lazy(() => import('./pages/Charity'));
const CharityLeaderboard = lazy(() => import('./pages/CharityLeaderboard'));
const ChartAnalysis = lazy(() => import('./pages/ChartAnalysis'));
const ChartDashboard = lazy(() => import('./pages/ChartDashboard'));
const ChatBot = lazy(() => import('./pages/ChatBot'));
const ChatHistory = lazy(() => import('./pages/ChatHistory'));
const ChatMVP = lazy(() => import('./pages/ChatMVP'));
const CheckboxGroupForm = lazy(() => import('./pages/CheckboxGroupForm'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutFlow = lazy(() => import('./pages/CheckoutFlow'));
const ChinaEdition = lazy(() => import('./pages/ChinaEdition'));
const ChurnPrediction = lazy(() => import('./pages/ChurnPrediction'));
const CitizenPassport = lazy(() => import('./pages/CitizenPassport'));
const CivilizationSimulator = lazy(() => import('./pages/CivilizationSimulator'));
const ClanWars = lazy(() => import('./pages/ClanWars'));
const ClassroomManagement = lazy(() => import('./pages/ClassroomManagement'));
const ClientLibraries = lazy(() => import('./pages/ClientLibraries'));
const ClosingChecklist = lazy(() => import('./pages/ClosingChecklist'));
const CodeCompletion = lazy(() => import('./pages/CodeCompletion'));
const CodeFormatter = lazy(() => import('./pages/CodeFormatter'));
const CodeHighlighting = lazy(() => import('./pages/CodeHighlighting'));
const CodeQuality = lazy(() => import('./pages/CodeQuality'));
const CodeQualityDashboard = lazy(() => import('./pages/CodeQualityDashboard'));
const CodeRepository = lazy(() => import('./pages/CodeRepository'));
const CodeSamples = lazy(() => import('./pages/CodeSamples'));
const CohortAnalysis = lazy(() => import('./pages/CohortAnalysis'));
const ColorPickerDialog = lazy(() => import('./pages/ColorPickerDialog'));
const CommentThread = lazy(() => import('./pages/CommentThread'));
const Comments = lazy(() => import('./pages/Comments'));
const CommentsSection = lazy(() => import('./pages/CommentsSection'));
const CommissionManagement = lazy(() => import('./pages/CommissionManagement'));
const Community = lazy(() => import('./pages/Community'));
const CommunityCreate = lazy(() => import('./pages/CommunityCreate'));
const CommunityEngagement = lazy(() => import('./pages/CommunityEngagement'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const CommunityHub = lazy(() => import('./pages/CommunityHub'));
const CompanySimulator = lazy(() => import('./pages/CompanySimulator'));
const CompetitiveRadar = lazy(() => import('./pages/CompetitiveRadar'));
const ComplianceCenter = lazy(() => import('./pages/ComplianceCenter'));
const ComplianceChecker = lazy(() => import('./pages/ComplianceChecker'));
const ComplianceChecking = lazy(() => import('./pages/ComplianceChecking'));
const ComplianceDashboard = lazy(() => import('./pages/ComplianceDashboard'));
const ComplianceReports = lazy(() => import('./pages/ComplianceReports'));
const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase'));
const ComprehensiveEcosystemLanding = lazy(() => import('./pages/ComprehensiveEcosystemLanding'));
const ConfirmationDialog = lazy(() => import('./pages/ConfirmationDialog'));
const ConnectedApps = lazy(() => import('./pages/ConnectedApps'));
const ConnectionError = lazy(() => import('./pages/ConnectionError'));
const ConnectionRequests = lazy(() => import('./pages/ConnectionRequests'));
const ConnectorIntelligence = lazy(() => import('./pages/ConnectorIntelligence'));
const ContactManagement = lazy(() => import('./pages/ContactManagement'));
const ContactUsForm = lazy(() => import('./pages/ContactUsForm'));
const ContentAnalytics = lazy(() => import('./pages/ContentAnalytics'));
const ContentCalendar = lazy(() => import('./pages/ContentCalendar'));
const ContentCollaboration = lazy(() => import('./pages/ContentCollaboration'));
const ContentFlagging = lazy(() => import('./pages/ContentFlagging'));
const ContentLibrary = lazy(() => import('./pages/ContentLibrary'));
const ContentModeration = lazy(() => import('./pages/ContentModeration'));
const ContentScheduler = lazy(() => import('./pages/ContentScheduler'));
const ContentScheduling = lazy(() => import('./pages/ContentScheduling'));
const ContentUpload = lazy(() => import('./pages/ContentUpload'));
const ContentVault = lazy(() => import('./pages/ContentVault'));
const ContextMenu = lazy(() => import('./pages/ContextMenu'));
const ContractABI = lazy(() => import('./pages/ContractABI'));
const ContractManagement = lazy(() => import('./pages/ContractManagement'));
const ContributionInterface = lazy(() => import('./pages/ContributionInterface'));
const ConversationArchive = lazy(() => import('./pages/ConversationArchive'));
const ConversationHistory = lazy(() => import('./pages/ConversationHistory'));
const ConversionFunnel = lazy(() => import('./pages/ConversionFunnel'));
const ConversionOptimization = lazy(() => import('./pages/ConversionOptimization'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const CopyrightManagement = lazy(() => import('./pages/CopyrightManagement'));
const CostAllocation = lazy(() => import('./pages/CostAllocation'));
const CostBasisCalculation = lazy(() => import('./pages/CostBasisCalculation'));
const CourseBuilder = lazy(() => import('./pages/CourseBuilder'));
const CourseCatalog = lazy(() => import('./pages/CourseCatalog'));
const CoverPhoto = lazy(() => import('./pages/CoverPhoto'));
const CreateArticle = lazy(() => import('./pages/CreateArticle'));
const CreateAudio = lazy(() => import('./pages/CreateAudio'));
const CreateDrop = lazy(() => import('./pages/CreateDrop'));
const CreateReel = lazy(() => import('./pages/CreateReel'));
const CreatorAnalytics = lazy(() => import('./pages/CreatorAnalytics'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const CreatorEconomy = lazy(() => import('./pages/CreatorEconomy'));
const CreatorFunding = lazy(() => import('./pages/CreatorFunding'));
const CreatorGrants = lazy(() => import('./pages/CreatorGrants'));
const CreatorIntelligence = lazy(() => import('./pages/CreatorIntelligence'));
const CreatorMonetization = lazy(() => import('./pages/CreatorMonetization'));
const CreatorNetwork = lazy(() => import('./pages/CreatorNetwork'));
const CreatorOnboarding = lazy(() => import('./pages/CreatorOnboarding'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const CreatorSpotlight = lazy(() => import('./pages/CreatorSpotlight'));
const CreatorStudio = lazy(() => import('./pages/CreatorStudio'));
const CrossChainInterop = lazy(() => import('./pages/CrossChainInterop'));
const CrossChainSwap = lazy(() => import('./pages/CrossChainSwap'));
const Crypto = lazy(() => import('./pages/Crypto'));
const CryptoEnhancementsPage = lazy(() => import('./pages/CryptoEnhancementsPage'));
const CryptoExchange = lazy(() => import('./pages/CryptoExchange'));
const CryptoHub = lazy(() => import('./pages/CryptoHub'));
const CryptoNews = lazy(() => import('./pages/CryptoNews'));
const CryptoResearchHub = lazy(() => import('./pages/CryptoResearchHub'));
const CustomDashboard = lazy(() => import('./pages/CustomDashboard'));
const CustomReports = lazy(() => import('./pages/CustomReports'));
const CustomerAnalytics = lazy(() => import('./pages/CustomerAnalytics'));
const CustomerDisputes = lazy(() => import('./pages/CustomerDisputes'));
const DAOGovernance = lazy(() => import('./pages/DAOGovernance'));
const DAOTreasury = lazy(() => import('./pages/DAOTreasury'));
const DCACalculator = lazy(() => import('./pages/DCACalculator'));
const DEXDepthChart = lazy(() => import('./pages/DEXDepthChart'));
const DMInbox = lazy(() => import('./pages/DMInbox'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const DataExport = lazy(() => import('./pages/DataExport'));
const DataGrid = lazy(() => import('./pages/DataGrid'));
const DataLake = lazy(() => import('./pages/DataLake'));
const DataPrivacy = lazy(() => import('./pages/DataPrivacy'));
const DataProcessing = lazy(() => import('./pages/DataProcessing'));
const DataRetention = lazy(() => import('./pages/DataRetention'));
const DataTable = lazy(() => import('./pages/DataTable'));
const DataVisualization = lazy(() => import('./pages/DataVisualization'));
const DatabaseManagement = lazy(() => import('./pages/DatabaseManagement'));
const DateInputForm = lazy(() => import('./pages/DateInputForm'));
const DatePickerDialog = lazy(() => import('./pages/DatePickerDialog'));
const DatingDiscovery = lazy(() => import('./pages/DatingDiscovery'));
const DatingHome = lazy(() => import('./pages/DatingHome'));
const DatingMatches = lazy(() => import('./pages/DatingMatches'));
const DatingMessages = lazy(() => import('./pages/DatingMessages'));
const DatingPremium = lazy(() => import('./pages/DatingPremium'));
const DatingProfile = lazy(() => import('./pages/DatingProfile'));
const DatingProfileSetup = lazy(() => import('./pages/DatingProfileSetup'));
const DatingSubscription = lazy(() => import('./pages/DatingSubscription'));
const DayTradeRoom = lazy(() => import('./pages/DayTradeRoom'));
const DeFi = lazy(() => import('./pages/DeFi'));
const DecentralizedIdentity = lazy(() => import('./pages/DecentralizedIdentity'));
const DefensibilityMoat = lazy(() => import('./pages/DefensibilityMoat'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const DeleteContent = lazy(() => import('./pages/DeleteContent'));
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'));
const DependencyGraph = lazy(() => import('./pages/DependencyGraph'));
const DeploymentPipeline = lazy(() => import('./pages/DeploymentPipeline'));
const DeprecationPolicy = lazy(() => import('./pages/DeprecationPolicy'));
const DerivativeTrading = lazy(() => import('./pages/DerivativeTrading'));
const DerivativesTrading = lazy(() => import('./pages/DerivativesTrading'));
const DestinationGuide = lazy(() => import('./pages/DestinationGuide'));
const DestinyEngine = lazy(() => import('./pages/DestinyEngine'));
const DevOps = lazy(() => import('./pages/DevOps'));
const DeveloperArea = lazy(() => import('./pages/DeveloperArea'));
const DeveloperCommunity = lazy(() => import('./pages/DeveloperCommunity'));
const DeveloperMarketplace = lazy(() => import('./pages/DeveloperMarketplace'));
const DeveloperProtocol = lazy(() => import('./pages/DeveloperProtocol'));
const DifficultyCalculator = lazy(() => import('./pages/DifficultyCalculator'));
const DifficultyTracking = lazy(() => import('./pages/DifficultyTracking'));
const DigitalArtStore = lazy(() => import('./pages/DigitalArtStore'));
const DigitalNationMode = lazy(() => import('./pages/DigitalNationMode'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const DirectMessaging = lazy(() => import('./pages/DirectMessaging'));
const DisasterRecovery = lazy(() => import('./pages/DisasterRecovery'));
const DiscordIntegration = lazy(() => import('./pages/DiscordIntegration'));
const Discover = lazy(() => import('./pages/Discover'));
const DiscussionBoard = lazy(() => import('./pages/DiscussionBoard'));
const DiscussionForums = lazy(() => import('./pages/DiscussionForums'));
const DisputeResolution = lazy(() => import('./pages/DisputeResolution'));
const DistributionChannels = lazy(() => import('./pages/DistributionChannels'));
const DocumentEditor = lazy(() => import('./pages/DocumentEditor'));
const DocumentManagement = lazy(() => import('./pages/DocumentManagement'));
const DocumentSharing = lazy(() => import('./pages/DocumentSharing'));
const DocumentSigning = lazy(() => import('./pages/DocumentSigning'));
const Documentation = lazy(() => import('./pages/Documentation'));
const DogecoinPoolSelection = lazy(() => import('./pages/DogecoinPoolSelection'));
const DomainManagement = lazy(() => import('./pages/DomainManagement'));
const DonationProcessing = lazy(() => import('./pages/DonationProcessing'));
const DropdownMenu = lazy(() => import('./pages/DropdownMenu'));
const ENSResolver = lazy(() => import('./pages/ENSResolver'));
const EarningsTracker = lazy(() => import('./pages/EarningsTracker'));
const EarningsTracking = lazy(() => import('./pages/EarningsTracking'));
const EconomicLayer = lazy(() => import('./pages/EconomicLayer'));
const Economics = lazy(() => import('./pages/Economics'));
const EconomyControl = lazy(() => import('./pages/EconomyControl'));
const Ecosystem = lazy(() => import('./pages/Ecosystem'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EmailCampaigns = lazy(() => import('./pages/EmailCampaigns'));
const EmailConfiguration = lazy(() => import('./pages/EmailConfiguration'));
const EmailInputForm = lazy(() => import('./pages/EmailInputForm'));
const EmailIntegration = lazy(() => import('./pages/EmailIntegration'));
const EmailNotifications = lazy(() => import('./pages/EmailNotifications'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));
const EmbedSDK = lazy(() => import('./pages/EmbedSDK'));
const EmptySearchState = lazy(() => import('./pages/EmptySearchState'));
const EngagementMetrics = lazy(() => import('./pages/EngagementMetrics'));
const EngagementStats = lazy(() => import('./pages/EngagementStats'));
const Engineer = lazy(() => import('./pages/Engineer'));
const Enterprise = lazy(() => import('./pages/Enterprise'));
const EnterpriseAPI = lazy(() => import('./pages/EnterpriseAPI'));
const EnterpriseAnalytics = lazy(() => import('./pages/EnterpriseAnalytics'));
const EnterpriseBilling = lazy(() => import('./pages/EnterpriseBilling'));
const EntityProfile = lazy(() => import('./pages/EntityProfile'));
const EnvironmentManagement = lazy(() => import('./pages/EnvironmentManagement'));
const Error403 = lazy(() => import('./pages/Error403'));
const Error404 = lazy(() => import('./pages/Error404'));
const Error500 = lazy(() => import('./pages/Error500'));
const Error503 = lazy(() => import('./pages/Error503'));
const ErrorDialog = lazy(() => import('./pages/ErrorDialog'));
const ErrorTracking = lazy(() => import('./pages/ErrorTracking'));
const EscrowShop = lazy(() => import('./pages/EscrowShop'));
const EthereumPoolSelector = lazy(() => import('./pages/EthereumPoolSelector'));
const EventAnalytics = lazy(() => import('./pages/EventAnalytics'));
const EventCalendar = lazy(() => import('./pages/EventCalendar'));
const EventCreation = lazy(() => import('./pages/EventCreation'));
const EventPlanner = lazy(() => import('./pages/EventPlanner'));
const EventRegistration = lazy(() => import('./pages/EventRegistration'));
const Events = lazy(() => import('./pages/Events'));
const ExecutionHistory = lazy(() => import('./pages/ExecutionHistory'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'));
const ExpenseManagement = lazy(() => import('./pages/ExpenseManagement'));
const ExpenseTracker = lazy(() => import('./pages/ExpenseTracker'));
const ExperimentFactory = lazy(() => import('./pages/ExperimentFactory'));
const ExperimentTracker = lazy(() => import('./pages/ExperimentTracker'));
const Explore = lazy(() => import('./pages/Explore'));
const ExportData = lazy(() => import('./pages/ExportData'));
const FAQManagement = lazy(() => import('./pages/FAQManagement'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const Farming = lazy(() => import('./pages/Farming'));
const Favorites = lazy(() => import('./pages/Favorites'));
const FeatureRequests = lazy(() => import('./pages/FeatureRequests'));
const FeatureTour = lazy(() => import('./pages/FeatureTour'));
const Features = lazy(() => import('./pages/Features'));
const FeeCalculation = lazy(() => import('./pages/FeeCalculation'));
const FeedWithPosts = lazy(() => import('./pages/FeedWithPosts'));
const Feedback = lazy(() => import('./pages/Feedback'));
const FeedbackDialog = lazy(() => import('./pages/FeedbackDialog'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const FeedbackHub = lazy(() => import('./pages/FeedbackHub'));
const FileBrowser = lazy(() => import('./pages/FileBrowser'));
const FileConverter = lazy(() => import('./pages/FileConverter'));
const FileDownload = lazy(() => import('./pages/FileDownload'));
const FilePreview = lazy(() => import('./pages/FilePreview'));
const FileSharing = lazy(() => import('./pages/FileSharing'));
const FileUploadDialog = lazy(() => import('./pages/FileUploadDialog'));
const FileUploadForm = lazy(() => import('./pages/FileUploadForm'));
const FileUploadProgress = lazy(() => import('./pages/FileUploadProgress'));
const FileVersioning = lazy(() => import('./pages/FileVersioning'));
const FilterPanel = lazy(() => import('./pages/FilterPanel'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const FlashLoans = lazy(() => import('./pages/FlashLoans'));
const FlightSearch = lazy(() => import('./pages/FlightSearch'));
const FollowList = lazy(() => import('./pages/FollowList'));
const FollowRequests = lazy(() => import('./pages/FollowRequests'));
const FollowSystem = lazy(() => import('./pages/FollowSystem'));
const FollowUnfollow = lazy(() => import('./pages/FollowUnfollow'));
const FollowerList = lazy(() => import('./pages/FollowerList'));
const FollowersNetwork = lazy(() => import('./pages/FollowersNetwork'));
const ForecastingEngine = lazy(() => import('./pages/ForecastingEngine'));
const ForumCategories = lazy(() => import('./pages/ForumCategories'));
const FrameworkTemplates = lazy(() => import('./pages/FrameworkTemplates'));
const FreeWillDashboard = lazy(() => import('./pages/FreeWillDashboard'));
const FundraiserTools = lazy(() => import('./pages/FundraiserTools'));
const GDPR = lazy(() => import('./pages/GDPR'));
const GTMStrategy = lazy(() => import('./pages/GTMStrategy'));
const GainLossTracking = lazy(() => import('./pages/GainLossTracking'));
const GameBlackjack = lazy(() => import('./pages/GameBlackjack'));
const GameBlockBuilder = lazy(() => import('./pages/GameBlockBuilder'));
const GameChat = lazy(() => import('./pages/GameChat'));
const GameCrash = lazy(() => import('./pages/GameCrash'));
const GameCryptoQuiz = lazy(() => import('./pages/GameCryptoQuiz'));
const GameFiQuestBoard = lazy(() => import('./pages/GameFiQuestBoard'));
const GameLobby = lazy(() => import('./pages/GameLobby'));
const GameRoom = lazy(() => import('./pages/GameRoom'));
const GameSettings = lazy(() => import('./pages/GameSettings'));
const GameSlots = lazy(() => import('./pages/GameSlots'));
const GameTokenTap = lazy(() => import('./pages/GameTokenTap'));
const Gaming = lazy(() => import('./pages/Gaming'));
const GamingForCharity = lazy(() => import('./pages/GamingForCharity'));
const GanttChart = lazy(() => import('./pages/GanttChart'));
const GasFeeEstimator = lazy(() => import('./pages/GasFeeEstimator'));
const GasPriceMonitor = lazy(() => import('./pages/GasPriceMonitor'));
const GasTracker = lazy(() => import('./pages/GasTracker'));
const GeneralSettings = lazy(() => import('./pages/GeneralSettings'));
const GeneratedApiExplorer = lazy(() => import('./pages/GeneratedApiExplorer'));
const GeneratedGallery = lazy(() => import('./pages/GeneratedGallery'));
const GettingStartedGuide = lazy(() => import('./pages/GettingStartedGuide'));
const GhostMode = lazy(() => import('./pages/GhostMode'));
const GlobalOperationsCenter = lazy(() => import('./pages/GlobalOperationsCenter'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const Governance = lazy(() => import('./pages/Governance'));
const GovernanceVoting = lazy(() => import('./pages/GovernanceVoting'));
const GovernanceWizard = lazy(() => import('./pages/GovernanceWizard'));
const GradeBook = lazy(() => import('./pages/GradeBook'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const GroupChats = lazy(() => import('./pages/GroupChats'));
const GroupDirectory = lazy(() => import('./pages/GroupDirectory'));
const GroupEvents = lazy(() => import('./pages/GroupEvents'));
const GroupManagement = lazy(() => import('./pages/GroupManagement'));
const Growth = lazy(() => import('./pages/Growth'));
const Guilds = lazy(() => import('./pages/Guilds'));
const HIPAA = lazy(() => import('./pages/HIPAA'));
const HOPEAIControl = lazy(() => import('./pages/HOPEAIControl'));
const HashRateMonitor = lazy(() => import('./pages/HashRateMonitor'));
const HashtagExplorer = lazy(() => import('./pages/HashtagExplorer'));
const HashtagSearch = lazy(() => import('./pages/HashtagSearch'));
const Hashtags = lazy(() => import('./pages/Hashtags'));
const HealthArticles = lazy(() => import('./pages/HealthArticles'));
const HealthDashboard = lazy(() => import('./pages/HealthDashboard'));
const HealthGoals = lazy(() => import('./pages/HealthGoals'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const HopeAI = lazy(() => import('./pages/HopeAI'));
const HopeAIAdvanced = lazy(() => import('./pages/HopeAIAdvanced'));
const HopeAIMeta = lazy(() => import('./pages/HopeAIMeta'));
const HopeAIPage = lazy(() => import('./pages/HopeAIPage'));
const HopeAIUpgrades = lazy(() => import('./pages/HopeAIUpgrades'));
const HotelSearch = lazy(() => import('./pages/HotelSearch'));
const HubSpotIntegration = lazy(() => import('./pages/HubSpotIntegration'));
const ICOLaunchpad = lazy(() => import('./pages/ICOLaunchpad'));
const IFTTT = lazy(() => import('./pages/IFTTT'));
const IITR = lazy(() => import('./pages/IITR'));
const ITServicesLanding = lazy(() => import('./pages/ITServicesLanding'));
const ITServicesPortal = lazy(() => import('./pages/ITServicesPortal'));
const ImageEditor = lazy(() => import('./pages/ImageEditor'));
const ImageGallery = lazy(() => import('./pages/ImageGallery'));
const ImageTools = lazy(() => import('./pages/ImageTools'));
const ImageViewer = lazy(() => import('./pages/ImageViewer'));
const ImpactMap = lazy(() => import('./pages/ImpactMap'));
const ImpactMetrics = lazy(() => import('./pages/ImpactMetrics'));
const InAppNotifications = lazy(() => import('./pages/InAppNotifications'));
const InGameCurrency = lazy(() => import('./pages/InGameCurrency'));
const IncidentManagement = lazy(() => import('./pages/IncidentManagement'));
const InputDialog = lazy(() => import('./pages/InputDialog'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const IntegrationSetup = lazy(() => import('./pages/IntegrationSetup'));
const Integrations = lazy(() => import('./pages/Integrations'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));
const InvestmentGoals = lazy(() => import('./pages/InvestmentGoals'));
const InvestorMetrics = lazy(() => import('./pages/InvestorMetrics'));
const InvestorPitch = lazy(() => import('./pages/InvestorPitch'));
const InvestorPortal = lazy(() => import('./pages/InvestorPortal'));
const InvestorRoom = lazy(() => import('./pages/InvestorRoom'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const InvoiceManagement = lazy(() => import('./pages/InvoiceManagement'));
const KYCVerification = lazy(() => import('./pages/KYCVerification'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const LDAPIntegration = lazy(() => import('./pages/LDAPIntegration'));
const LTVAnalysis = lazy(() => import('./pages/LTVAnalysis'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LanguageExchangeAdmin = lazy(() => import('./pages/LanguageExchangeAdmin'));
const LanguagePartnerDiscovery = lazy(() => import('./pages/LanguagePartnerDiscovery'));
const LanguageSelector = lazy(() => import('./pages/LanguageSelector'));
const LanguageSettings = lazy(() => import('./pages/LanguageSettings'));
const LeadScoring = lazy(() => import('./pages/LeadScoring'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Leaderboards = lazy(() => import('./pages/Leaderboards'));
const Learning = lazy(() => import('./pages/Learning'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const LegalDocuments = lazy(() => import('./pages/LegalDocuments'));
const LegendaryStatus = lazy(() => import('./pages/LegendaryStatus'));
const LendingBorrow = lazy(() => import('./pages/LendingBorrow'));
const LendingBorrowing = lazy(() => import('./pages/LendingBorrowing'));
const LessonEditor = lazy(() => import('./pages/LessonEditor'));
const LifeCommand = lazy(() => import('./pages/LifeCommand'));
const Lightbox = lazy(() => import('./pages/Lightbox'));
const LikeReactionSystem = lazy(() => import('./pages/LikeReactionSystem'));
const Likes = lazy(() => import('./pages/Likes'));
const LiquidStaking = lazy(() => import('./pages/LiquidStaking'));
const LiquidityPools = lazy(() => import('./pages/LiquidityPools'));
const ListView = lazy(() => import('./pages/ListView'));
const Live = lazy(() => import('./pages/Live'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const LiveGifting = lazy(() => import('./pages/LiveGifting'));
const LiveReactions = lazy(() => import('./pages/LiveReactions'));
const LiveStreamSetup = lazy(() => import('./pages/LiveStreamSetup'));
const LiveStreaming = lazy(() => import('./pages/LiveStreaming'));
const LivestreamDashboard = lazy(() => import('./pages/LivestreamDashboard'));
const LoadBalancing = lazy(() => import('./pages/LoadBalancing'));
const LoadingDialog = lazy(() => import('./pages/LoadingDialog'));
const LogViewer = lazy(() => import('./pages/LogViewer'));
const Login = lazy(() => import('./pages/Login'));
const LogisticsOptimizer = lazy(() => import('./pages/LogisticsOptimizer'));
const MLInsights = lazy(() => import('./pages/MLInsights'));
const MLModels = lazy(() => import('./pages/MLModels'));
const MailingLists = lazy(() => import('./pages/MailingLists'));
const MainDashboard = lazy(() => import('./pages/MainDashboard'));
const MaintenanceMode = lazy(() => import('./pages/MaintenanceMode'));
const MapView = lazy(() => import('./pages/MapView'));
const MarginTrading = lazy(() => import('./pages/MarginTrading'));
const MarkdownRendering = lazy(() => import('./pages/MarkdownRendering'));
const MarketSentiment = lazy(() => import('./pages/MarketSentiment'));
const MarketingROI = lazy(() => import('./pages/MarketingROI'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const MarketplaceAnalytics = lazy(() => import('./pages/MarketplaceAnalytics'));
const MasterArchitecture = lazy(() => import('./pages/MasterArchitecture'));
const MatchChat = lazy(() => import('./pages/MatchChat'));
const MatchFeed = lazy(() => import('./pages/MatchFeed'));
const MatchSpace = lazy(() => import('./pages/MatchSpace'));
const MatchingAlgorithm = lazy(() => import('./pages/MatchingAlgorithm'));
const Matchmaking = lazy(() => import('./pages/Matchmaking'));
const MealPlans = lazy(() => import('./pages/MealPlans'));
const MediaCarousel = lazy(() => import('./pages/MediaCarousel'));
const MediaGallery = lazy(() => import('./pages/MediaGallery'));
const MedicationReminder = lazy(() => import('./pages/MedicationReminder'));
const MegaMarketplace = lazy(() => import('./pages/MegaMarketplace'));
const MembershipTiers = lazy(() => import('./pages/MembershipTiers'));
const MemoryConstellation = lazy(() => import('./pages/MemoryConstellation'));
const MemoryGraphVisualizer = lazy(() => import('./pages/MemoryGraphVisualizer'));
const MemorySystem = lazy(() => import('./pages/MemorySystem'));
const Mentions = lazy(() => import('./pages/Mentions'));
const MessageEncryption = lazy(() => import('./pages/MessageEncryption'));
const MessageSearch = lazy(() => import('./pages/MessageSearch'));
const Messages = lazy(() => import('./pages/Messages'));
const MetaversePortal = lazy(() => import('./pages/MetaversePortal'));
const MilestoneTracking = lazy(() => import('./pages/MilestoneTracking'));
const MinerDashboard = lazy(() => import('./pages/MinerDashboard'));
const MiningCalculator = lazy(() => import('./pages/MiningCalculator'));
const MiningDashboard = lazy(() => import('./pages/MiningDashboard'));
const MiningPoolSelector = lazy(() => import('./pages/MiningPoolSelector'));
const MissionControl = lazy(() => import('./pages/MissionControl'));
const Mobile = lazy(() => import('./pages/Mobile'));
const MobileApp = lazy(() => import('./pages/MobileApp'));
const MobileGaming = lazy(() => import('./pages/MobileGaming'));
const MobileHome = lazy(() => import('./pages/MobileHome'));
const MobileMenu = lazy(() => import('./pages/MobileMenu'));
const MobileMessages = lazy(() => import('./pages/MobileMessages'));
const MobileNotifications = lazy(() => import('./pages/MobileNotifications'));
const MobileProfile = lazy(() => import('./pages/MobileProfile'));
const MobileSearch = lazy(() => import('./pages/MobileSearch'));
const MobileSettings = lazy(() => import('./pages/MobileSettings'));
const MobileShop = lazy(() => import('./pages/MobileShop'));
const MobileStreaming = lazy(() => import('./pages/MobileStreaming'));
const MobileTrading = lazy(() => import('./pages/MobileTrading'));
const MobileWallet = lazy(() => import('./pages/MobileWallet'));
const ModerationDashboard = lazy(() => import('./pages/ModerationDashboard'));
const Monetization = lazy(() => import('./pages/Monetization'));
const MoodTracker = lazy(() => import('./pages/MoodTracker'));
const MortgageCalculator = lazy(() => import('./pages/MortgageCalculator'));
const MovieCatalog = lazy(() => import('./pages/MovieCatalog'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const MultiModelSelector = lazy(() => import('./pages/MultiModelSelector'));
const MultiSelectForm = lazy(() => import('./pages/MultiSelectForm'));
const MultiplayerLobby = lazy(() => import('./pages/MultiplayerLobby'));
const MultivariateTesting = lazy(() => import('./pages/MultivariateTesting'));
const MusicGeneration = lazy(() => import('./pages/MusicGeneration'));
const MutualConnections = lazy(() => import('./pages/MutualConnections'));
const MutualFriends = lazy(() => import('./pages/MutualFriends'));
const MyLearning = lazy(() => import('./pages/MyLearning'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const NFTGallery = lazy(() => import('./pages/NFTGallery'));
const NFTMinting = lazy(() => import('./pages/NFTMinting'));
const NFTWallet = lazy(() => import('./pages/NFTWallet'));
const NLPTools = lazy(() => import('./pages/NLPTools'));
const NSFWFeed = lazy(() => import('./pages/NSFWFeed'));
const NSFWPlatform = lazy(() => import('./pages/NSFWPlatform'));
const NarrativeEngine = lazy(() => import('./pages/NarrativeEngine'));
const NetWorthTracker = lazy(() => import('./pages/NetWorthTracker'));
const NetworkGraph = lazy(() => import('./pages/NetworkGraph'));
const NetworkHealth = lazy(() => import('./pages/NetworkHealth'));
const NetworkStatistics = lazy(() => import('./pages/NetworkStatistics'));
const NotesApp = lazy(() => import('./pages/NotesApp'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const NotificationHistory = lazy(() => import('./pages/NotificationHistory'));
const NotificationIntelligence = lazy(() => import('./pages/NotificationIntelligence'));
const NotificationPreferences = lazy(() => import('./pages/NotificationPreferences'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotificationsCenter = lazy(() => import('./pages/NotificationsCenter'));
const NotificationsHub = lazy(() => import('./pages/NotificationsHub'));
const NumberInputForm = lazy(() => import('./pages/NumberInputForm'));
const NutritionTracker = lazy(() => import('./pages/NutritionTracker'));
const OAuthProviders = lazy(() => import('./pages/OAuthProviders'));
const OfferManagement = lazy(() => import('./pages/OfferManagement'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const OnboardingTutorial = lazy(() => import('./pages/OnboardingTutorial'));
const OptionsTrading = lazy(() => import('./pages/OptionsTrading'));
const OracleNetwork = lazy(() => import('./pages/OracleNetwork'));
const OrderBook = lazy(() => import('./pages/OrderBook'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const OrderPlacement = lazy(() => import('./pages/OrderPlacement'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const OrderTypes = lazy(() => import('./pages/OrderTypes'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const P2EShop = lazy(() => import('./pages/P2EShop'));
const Pagination = lazy(() => import('./pages/Pagination'));
const PasswordInputForm = lazy(() => import('./pages/PasswordInputForm'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));
const PayPalIntegration = lazy(() => import('./pages/PayPalIntegration'));
const PaymentConfirmation = lazy(() => import('./pages/PaymentConfirmation'));
const PaymentInfra = lazy(() => import('./pages/PaymentInfra'));
const PaymentMethods = lazy(() => import('./pages/PaymentMethods'));
const PaymentSetup = lazy(() => import('./pages/PaymentSetup'));
const Payments = lazy(() => import('./pages/Payments'));
const PayoutDashboard = lazy(() => import('./pages/PayoutDashboard'));
const PayoutManagement = lazy(() => import('./pages/PayoutManagement'));
const PerformanceMetrics = lazy(() => import('./pages/PerformanceMetrics'));
const PerformanceTuning = lazy(() => import('./pages/PerformanceTuning'));
const PermissionManagement = lazy(() => import('./pages/PermissionManagement'));
const PerpetualFutures = lazy(() => import('./pages/PerpetualFutures'));
const PersonaBuilder = lazy(() => import('./pages/PersonaBuilder'));
const Phase1Dashboard = lazy(() => import('./pages/Phase1Dashboard'));
const Phase2to4Dashboard = lazy(() => import('./pages/Phase2to4Dashboard'));
const PhoneVerification = lazy(() => import('./pages/PhoneVerification'));
const PlatformMap = lazy(() => import('./pages/PlatformMap'));
const PlatformStatus = lazy(() => import('./pages/PlatformStatus'));
const PlaylistManagement = lazy(() => import('./pages/PlaylistManagement'));
const PlaylistManager = lazy(() => import('./pages/PlaylistManager'));
const PodcastStudio = lazy(() => import('./pages/PodcastStudio'));
const PolicyManagement = lazy(() => import('./pages/PolicyManagement'));
const PoolPerformance = lazy(() => import('./pages/PoolPerformance'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioComparison = lazy(() => import('./pages/PortfolioComparison'));
const PortfolioOptimization = lazy(() => import('./pages/PortfolioOptimization'));
const PortfolioOverview = lazy(() => import('./pages/PortfolioOverview'));
const PortfolioRebalance = lazy(() => import('./pages/PortfolioRebalance'));
const PortfolioTracker = lazy(() => import('./pages/PortfolioTracker'));
const PortfolioTracking = lazy(() => import('./pages/PortfolioTracking'));
const PositionManagement = lazy(() => import('./pages/PositionManagement'));
const PowerUserTools = lazy(() => import('./pages/PowerUserTools'));
const PracticeSessions = lazy(() => import('./pages/PracticeSessions'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const PredictiveModels = lazy(() => import('./pages/PredictiveModels'));
const PredictiveSystems = lazy(() => import('./pages/PredictiveSystems'));
const PreferencesSetup = lazy(() => import('./pages/PreferencesSetup'));
const PremiumFeatures = lazy(() => import('./pages/PremiumFeatures'));
const PresentationWithChat = lazy(() => import('./pages/PresentationWithChat'));
const PriceAlerts = lazy(() => import('./pages/PriceAlerts'));
const Pricing = lazy(() => import('./pages/Pricing'));
const PricingEngine = lazy(() => import('./pages/PricingEngine'));
const PricingManagement = lazy(() => import('./pages/PricingManagement'));
const PricingRules = lazy(() => import('./pages/PricingRules'));
const PriorityMatrix = lazy(() => import('./pages/PriorityMatrix'));
const PrivacyMixer = lazy(() => import('./pages/PrivacyMixer'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'));
const PrivacyVault = lazy(() => import('./pages/PrivacyVault'));
const ProductApproval = lazy(() => import('./pages/ProductApproval'));
const ProductBrain = lazy(() => import('./pages/ProductBrain'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ProductListing = lazy(() => import('./pages/ProductListing'));
const ProductListings = lazy(() => import('./pages/ProductListings'));
const ProductReviews = lazy(() => import('./pages/ProductReviews'));
const ProductionArchitecture = lazy(() => import('./pages/ProductionArchitecture'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileCompletion = lazy(() => import('./pages/ProfileCompletion'));
const ProfileCreation = lazy(() => import('./pages/ProfileCreation'));
const ProfileCustomization = lazy(() => import('./pages/ProfileCustomization'));
const ProfileDashboard = lazy(() => import('./pages/ProfileDashboard'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit'));
const ProfilePicture = lazy(() => import('./pages/ProfilePicture'));
const ProfilePreview = lazy(() => import('./pages/ProfilePreview'));
const ProfileView = lazy(() => import('./pages/ProfileView'));
const ProfileWallet = lazy(() => import('./pages/ProfileWallet'));
const Profitability = lazy(() => import('./pages/Profitability'));
const ProgressBar = lazy(() => import('./pages/ProgressBar'));
const ProgressTracking = lazy(() => import('./pages/ProgressTracking'));
const ProjectBoard = lazy(() => import('./pages/ProjectBoard'));
const ProjectListing = lazy(() => import('./pages/ProjectListing'));
const PromotionEngine = lazy(() => import('./pages/PromotionEngine'));
const PromptBuilder = lazy(() => import('./pages/PromptBuilder'));
const ProofVault = lazy(() => import('./pages/ProofVault'));
const PropertyComparison = lazy(() => import('./pages/PropertyComparison'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const PropertyListing = lazy(() => import('./pages/PropertyListing'));
const PropertyTransfer = lazy(() => import('./pages/PropertyTransfer'));
const ProtocolLayer = lazy(() => import('./pages/ProtocolLayer'));
const PublishingQueue = lazy(() => import('./pages/PublishingQueue'));
const PublishingSchedule = lazy(() => import('./pages/PublishingSchedule'));
const PushNotifications = lazy(() => import('./pages/PushNotifications'));
const QRCodeGenerator = lazy(() => import('./pages/QRCodeGenerator'));
const QuantumComputing = lazy(() => import('./pages/QuantumComputing'));
const QuantumSafe = lazy(() => import('./pages/QuantumSafe'));
const QuickActions = lazy(() => import('./pages/QuickActions'));
const QuickStats = lazy(() => import('./pages/QuickStats'));
const QuizBuilder = lazy(() => import('./pages/QuizBuilder'));
const RFMAnalysis = lazy(() => import('./pages/RFMAnalysis'));
const RFQSystem = lazy(() => import('./pages/RFQSystem'));
const RadioButtonForm = lazy(() => import('./pages/RadioButtonForm'));
const RateLimitConfig = lazy(() => import('./pages/RateLimitConfig'));
const RateLimitDashboard = lazy(() => import('./pages/RateLimitDashboard'));
const RateLimitError = lazy(() => import('./pages/RateLimitError'));
const RateLimiting = lazy(() => import('./pages/RateLimiting'));
const RatingSystem = lazy(() => import('./pages/RatingSystem'));
const ReadReceipts = lazy(() => import('./pages/ReadReceipts'));
const RealTimeGameEngine = lazy(() => import('./pages/RealTimeGameEngine'));
const RealTimeMonitoring = lazy(() => import('./pages/RealTimeMonitoring'));
const RealTimeStreaming = lazy(() => import('./pages/RealTimeStreaming'));
const RebalancingTools = lazy(() => import('./pages/RebalancingTools'));
const ReceiptDownload = lazy(() => import('./pages/ReceiptDownload'));
const ReceiveCrypto = lazy(() => import('./pages/ReceiveCrypto'));
const RecentActivity = lazy(() => import('./pages/RecentActivity'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const RecommendationsFeed = lazy(() => import('./pages/RecommendationsFeed'));
const RecommendedMatches = lazy(() => import('./pages/RecommendedMatches'));
const Reels = lazy(() => import('./pages/Reels'));
const RefactoringTools = lazy(() => import('./pages/RefactoringTools'));
const Referrals = lazy(() => import('./pages/Referrals'));
const RefundRequests = lazy(() => import('./pages/RefundRequests'));
const RegionalSettings = lazy(() => import('./pages/RegionalSettings'));
const Reminders = lazy(() => import('./pages/Reminders'));
const ReportDialog = lazy(() => import('./pages/ReportDialog'));
const ReportUser = lazy(() => import('./pages/ReportUser'));
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard'));
const Reputation = lazy(() => import('./pages/Reputation'));
const ReputationSystem = lazy(() => import('./pages/ReputationSystem'));
const ResourceAllocation = lazy(() => import('./pages/ResourceAllocation'));
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'));
const ResponseTime = lazy(() => import('./pages/ResponseTime'));
const Retention = lazy(() => import('./pages/Retention'));
const RetentionAnalytics = lazy(() => import('./pages/RetentionAnalytics'));
const RetentionEngine = lazy(() => import('./pages/RetentionEngine'));
const RetirementPlanner = lazy(() => import('./pages/RetirementPlanner'));
const ReturnManagement = lazy(() => import('./pages/ReturnManagement'));
const ReturnsRefunds = lazy(() => import('./pages/ReturnsRefunds'));
const RevenueTracking = lazy(() => import('./pages/RevenueTracking'));
const ReviewModeration = lazy(() => import('./pages/ReviewModeration'));
const Reviews = lazy(() => import('./pages/Reviews'));
const ReviewsRatings = lazy(() => import('./pages/ReviewsRatings'));
const RewardSystem = lazy(() => import('./pages/RewardSystem'));
const RewardsMonitoring = lazy(() => import('./pages/RewardsMonitoring'));
const RewardsTracking = lazy(() => import('./pages/RewardsTracking'));
const RiskAnalysis = lazy(() => import('./pages/RiskAnalysis'));
const RiskManagement = lazy(() => import('./pages/RiskManagement'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const RoadmapView = lazy(() => import('./pages/RoadmapView'));
const RoleBasedAccess = lazy(() => import('./pages/RoleBasedAccess'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const SDKDownload = lazy(() => import('./pages/SDKDownload'));
const SDKManagement = lazy(() => import('./pages/SDKManagement'));
const SEOOptimizer = lazy(() => import('./pages/SEOOptimizer'));
const SKY444CentralBank = lazy(() => import('./pages/SKY444CentralBank'));
const SMSCampaigns = lazy(() => import('./pages/SMSCampaigns'));
const SMSIntegration = lazy(() => import('./pages/SMSIntegration'));
const SMSTemplates = lazy(() => import('./pages/SMSTemplates'));
const SMTPSettings = lazy(() => import('./pages/SMTPSettings'));
const SOC2 = lazy(() => import('./pages/SOC2'));
const SSLCertificates = lazy(() => import('./pages/SSLCertificates'));
const SSO = lazy(() => import('./pages/SSO'));
const SalesAnalytics = lazy(() => import('./pages/SalesAnalytics'));
const SalesforceIntegration = lazy(() => import('./pages/SalesforceIntegration'));
const SatisfactionSurvey = lazy(() => import('./pages/SatisfactionSurvey'));
const SavedProperties = lazy(() => import('./pages/SavedProperties'));
const SavedSearches = lazy(() => import('./pages/SavedSearches'));
const SavingsGoals = lazy(() => import('./pages/SavingsGoals'));
const ScheduledJobs = lazy(() => import('./pages/ScheduledJobs'));
const ScheduledReports = lazy(() => import('./pages/ScheduledReports'));
const School = lazy(() => import('./pages/School'));
const SchoolCertificate = lazy(() => import('./pages/SchoolCertificate'));
const SchoolCourse = lazy(() => import('./pages/SchoolCourse'));
const SchoolDashboard = lazy(() => import('./pages/SchoolDashboard'));
const SchoolLesson = lazy(() => import('./pages/SchoolLesson'));
const SchoolQuiz = lazy(() => import('./pages/SchoolQuiz'));
const Search = lazy(() => import('./pages/Search'));
const SearchAnalytics = lazy(() => import('./pages/SearchAnalytics'));
const SearchHistory = lazy(() => import('./pages/SearchHistory'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const SearchSuggestions = lazy(() => import('./pages/SearchSuggestions'));
const SeasonalEvents = lazy(() => import('./pages/SeasonalEvents'));
const Security = lazy(() => import('./pages/Security'));
const SecurityAudit = lazy(() => import('./pages/SecurityAudit'));
const SecurityCompliance = lazy(() => import('./pages/SecurityCompliance'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings'));
const SegmentationAnalysis = lazy(() => import('./pages/SegmentationAnalysis'));
const SelectDropdownForm = lazy(() => import('./pages/SelectDropdownForm'));
const SelfHealingInfra = lazy(() => import('./pages/SelfHealingInfra'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const SendCrypto = lazy(() => import('./pages/SendCrypto'));
const SentimentPipeline = lazy(() => import('./pages/SentimentPipeline'));
const ServerHealth = lazy(() => import('./pages/ServerHealth'));
const ServerInstaller = lazy(() => import('./pages/ServerInstaller'));
const ServerStatus = lazy(() => import('./pages/ServerStatus'));
const Settings = lazy(() => import('./pages/Settings'));
const SettingsDialog = lazy(() => import('./pages/SettingsDialog'));
const SetupWizard = lazy(() => import('./pages/SetupWizard'));
const ShadowIdentity = lazy(() => import('./pages/ShadowIdentity'));
const ShadowRelay = lazy(() => import('./pages/ShadowRelay'));
const ShareDialog = lazy(() => import('./pages/ShareDialog'));
const Shares = lazy(() => import('./pages/Shares'));
const Sharing = lazy(() => import('./pages/Sharing'));
const ShippingManagement = lazy(() => import('./pages/ShippingManagement'));
const ShoppingCart = lazy(() => import('./pages/ShoppingCart'));
const SidebarNavigation = lazy(() => import('./pages/SidebarNavigation'));
const SignUp = lazy(() => import('./pages/SignUp'));
const SignUpFlow = lazy(() => import('./pages/SignUpFlow'));
const SignUp_old = lazy(() => import('./pages/SignUp_old'));
const Signin = lazy(() => import('./pages/Signin'));
const SituationRoom = lazy(() => import('./pages/SituationRoom'));
const SkillBadges = lazy(() => import('./pages/SkillBadges'));
const SkySchool = lazy(() => import('./pages/SkySchool'));
const SkySchoolAI = lazy(() => import('./pages/SkySchoolAI'));
const SkySchoolQuiz = lazy(() => import('./pages/SkySchoolQuiz'));
const SkyStore = lazy(() => import('./pages/SkyStore'));
const SlackIntegration = lazy(() => import('./pages/SlackIntegration'));
const SleepTracking = lazy(() => import('./pages/SleepTracking'));
const SlippageProtection = lazy(() => import('./pages/SlippageProtection'));
const SmartContractAudit = lazy(() => import('./pages/SmartContractAudit'));
const SmartContractViewer = lazy(() => import('./pages/SmartContractViewer'));
const SmartContracts = lazy(() => import('./pages/SmartContracts'));
const SocialAnalytics = lazy(() => import('./pages/SocialAnalytics'));
const SocialEvents = lazy(() => import('./pages/SocialEvents'));
const SocialFeed = lazy(() => import('./pages/SocialFeed'));
const SocialFeedV2 = lazy(() => import('./pages/SocialFeedV2'));
const SocialGraph = lazy(() => import('./pages/SocialGraph'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const SocialMediaCampaigns = lazy(() => import('./pages/SocialMediaCampaigns'));
const SolanaValidatorSetup = lazy(() => import('./pages/SolanaValidatorSetup'));
const SortOptions = lazy(() => import('./pages/SortOptions'));
const SpeechToText = lazy(() => import('./pages/SpeechToText'));
const SpinWheel = lazy(() => import('./pages/SpinWheel'));
const Sponsorships = lazy(() => import('./pages/Sponsorships'));
const StakeDelegation = lazy(() => import('./pages/StakeDelegation'));
const StakingDashboard = lazy(() => import('./pages/StakingDashboard'));
const StakingHub = lazy(() => import('./pages/StakingHub'));
const StakingOptions = lazy(() => import('./pages/StakingOptions'));
const StakingPortal = lazy(() => import('./pages/StakingPortal'));
const StatisticsPanel = lazy(() => import('./pages/StatisticsPanel'));
const Status = lazy(() => import('./pages/Status'));
const StepperWizard = lazy(() => import('./pages/StepperWizard'));
const StockChart = lazy(() => import('./pages/StockChart'));
const StockSearch = lazy(() => import('./pages/StockSearch'));
const Stories = lazy(() => import('./pages/Stories'));
const StreamAnalytics = lazy(() => import('./pages/StreamAnalytics'));
const StreamClip = lazy(() => import('./pages/StreamClip'));
const StreamGifting = lazy(() => import('./pages/StreamGifting'));
const StreamingDashboard = lazy(() => import('./pages/StreamingDashboard'));
const StripeCheckout = lazy(() => import('./pages/StripeCheckout'));
const StripeIntegration = lazy(() => import('./pages/StripeIntegration'));
const StudentProgress = lazy(() => import('./pages/StudentProgress'));
const StyleSelector = lazy(() => import('./pages/StyleSelector'));
const SubscriberManagement = lazy(() => import('./pages/SubscriberManagement'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const SubscriptionPlans = lazy(() => import('./pages/SubscriptionPlans'));
const SubscriptionSetup = lazy(() => import('./pages/SubscriptionSetup'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const SuccessDialog = lazy(() => import('./pages/SuccessDialog'));
const SuccessScreen = lazy(() => import('./pages/SuccessScreen'));
const SupportMetrics = lazy(() => import('./pages/SupportMetrics'));
const SupportTicket = lazy(() => import('./pages/SupportTicket'));
const SwapInterface = lazy(() => import('./pages/SwapInterface'));
const SwipeInterface = lazy(() => import('./pages/SwipeInterface'));
const Synthetics = lazy(() => import('./pages/Synthetics'));
const SystemArchitecture = lazy(() => import('./pages/SystemArchitecture'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));
const SystemMonitoring = lazy(() => import('./pages/SystemMonitoring'));
const SystemObservability = lazy(() => import('./pages/SystemObservability'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const TabsNavigation = lazy(() => import('./pages/TabsNavigation'));
const TaskAutomation = lazy(() => import('./pages/TaskAutomation'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const TaskList = lazy(() => import('./pages/TaskList'));
const TaxDocumentation = lazy(() => import('./pages/TaxDocumentation'));
const TaxPlanning = lazy(() => import('./pages/TaxPlanning'));
const TaxReporting = lazy(() => import('./pages/TaxReporting'));
const TaxReports = lazy(() => import('./pages/TaxReports'));
const TeachingOpportunities = lazy(() => import('./pages/TeachingOpportunities'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const TeamWorkspace = lazy(() => import('./pages/TeamWorkspace'));
const TechnicalIndicators = lazy(() => import('./pages/TechnicalIndicators'));
const TelegramIntegration = lazy(() => import('./pages/TelegramIntegration'));
const TemplateLibrary = lazy(() => import('./pages/TemplateLibrary'));
const TermsAcceptance = lazy(() => import('./pages/TermsAcceptance'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const TestingFramework = lazy(() => import('./pages/TestingFramework'));
const TextInputForm = lazy(() => import('./pages/TextInputForm'));
const TextToSpeech = lazy(() => import('./pages/TextToSpeech'));
const TextTools = lazy(() => import('./pages/TextTools'));
const ThemeSettings = lazy(() => import('./pages/ThemeSettings'));
const ThreadManagement = lazy(() => import('./pages/ThreadManagement'));
const TicketAssignment = lazy(() => import('./pages/TicketAssignment'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const TicketQueue = lazy(() => import('./pages/TicketQueue'));
const TierComparison = lazy(() => import('./pages/TierComparison'));
const TimeInputForm = lazy(() => import('./pages/TimeInputForm'));
const TimePickerDialog = lazy(() => import('./pages/TimePickerDialog'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const TimelineView = lazy(() => import('./pages/TimelineView'));
const TimeoutError = lazy(() => import('./pages/TimeoutError'));
const TipJar = lazy(() => import('./pages/TipJar'));
const ToastNotifications = lazy(() => import('./pages/ToastNotifications'));
const TodoList = lazy(() => import('./pages/TodoList'));
const ToggleSwitchForm = lazy(() => import('./pages/ToggleSwitchForm'));
const TokenDashboard = lazy(() => import('./pages/TokenDashboard'));
const TokenGovernance = lazy(() => import('./pages/TokenGovernance'));
const TokenInformation = lazy(() => import('./pages/TokenInformation'));
const TokenMetrics = lazy(() => import('./pages/TokenMetrics'));
const TokenomicsCalculator = lazy(() => import('./pages/TokenomicsCalculator'));
const TorBridge = lazy(() => import('./pages/TorBridge'));
const TournamentBracket = lazy(() => import('./pages/TournamentBracket'));
const TournamentBrackets = lazy(() => import('./pages/TournamentBrackets'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const TradeHistory = lazy(() => import('./pages/TradeHistory'));
const Trading = lazy(() => import('./pages/Trading'));
const TradingBots = lazy(() => import('./pages/TradingBots'));
const TradingHistory = lazy(() => import('./pages/TradingHistory'));
const TradingTerminal = lazy(() => import('./pages/TradingTerminal'));
const TransactionExplorer = lazy(() => import('./pages/TransactionExplorer'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const TransactionViewer = lazy(() => import('./pages/TransactionViewer'));
const TranscriptionManager = lazy(() => import('./pages/TranscriptionManager'));
const TranslationEnabledCommunity = lazy(() => import('./pages/TranslationEnabledCommunity'));
const TranslationEnabledSocialFeed = lazy(() => import('./pages/TranslationEnabledSocialFeed'));
const TransparencyReports = lazy(() => import('./pages/TransparencyReports'));
const TravelBlog = lazy(() => import('./pages/TravelBlog'));
const TravelBudget = lazy(() => import('./pages/TravelBudget'));
const TravelDocuments = lazy(() => import('./pages/TravelDocuments'));
const TravelPhotos = lazy(() => import('./pages/TravelPhotos'));
const TravelReviews = lazy(() => import('./pages/TravelReviews'));
const TravelTips = lazy(() => import('./pages/TravelTips'));
const TreasuryManagement = lazy(() => import('./pages/TreasuryManagement'));
const TrendAnalysis = lazy(() => import('./pages/TrendAnalysis'));
const Trending = lazy(() => import('./pages/Trending'));
const TrendingContent = lazy(() => import('./pages/TrendingContent'));
const TrendingItems = lazy(() => import('./pages/TrendingItems'));
const TrendingTopics = lazy(() => import('./pages/TrendingTopics'));
const TriggersActions = lazy(() => import('./pages/TriggersActions'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const TrumpMining = lazy(() => import('./pages/TrumpMining'));
const TrustSafetyDashboard = lazy(() => import('./pages/TrustSafetyDashboard'));
const TrustSystem = lazy(() => import('./pages/TrustSystem'));
const TwoFactorAuth = lazy(() => import('./pages/TwoFactorAuth'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const TypingIndicators = lazy(() => import('./pages/TypingIndicators'));
const UnhiddenInterface = lazy(() => import('./pages/UnhiddenInterface'));
const UnhiddenMode = lazy(() => import('./pages/UnhiddenMode'));
const UnifiedFeed = lazy(() => import('./pages/UnifiedFeed'));
const UnifiedIdentity = lazy(() => import('./pages/UnifiedIdentity'));
const UnifiedMessaging = lazy(() => import('./pages/UnifiedMessaging'));
const UnifiedPaymentLedger = lazy(() => import('./pages/UnifiedPaymentLedger'));
const UnifiedPlatformDashboard = lazy(() => import('./pages/UnifiedPlatformDashboard'));
const UnifiedWallet = lazy(() => import('./pages/UnifiedWallet'));
const UniversalSearch = lazy(() => import('./pages/UniversalSearch'));
const UpdatedLandingPage = lazy(() => import('./pages/UpdatedLandingPage'));
const UpgradeDowngradePlan = lazy(() => import('./pages/UpgradeDowngradePlan'));
const Upscaling = lazy(() => import('./pages/Upscaling'));
const UserActivity = lazy(() => import('./pages/UserActivity'));
const UserBehavior = lazy(() => import('./pages/UserBehavior'));
const UserBio = lazy(() => import('./pages/UserBio'));
const UserDirectory = lazy(() => import('./pages/UserDirectory'));
const UserDiscovery = lazy(() => import('./pages/UserDiscovery'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const UserMentions = lazy(() => import('./pages/UserMentions'));
const UserOnboarding = lazy(() => import('./pages/UserOnboarding'));
const UserPermissions = lazy(() => import('./pages/UserPermissions'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UserProfiles = lazy(() => import('./pages/UserProfiles'));
const UserReputation = lazy(() => import('./pages/UserReputation'));
const UserSearch = lazy(() => import('./pages/UserSearch'));
const UserStats = lazy(() => import('./pages/UserStats'));
const UserSuggestions = lazy(() => import('./pages/UserSuggestions'));
const UserTimeline = lazy(() => import('./pages/UserTimeline'));
const VODArchive = lazy(() => import('./pages/VODArchive'));
const ValidatorPerformance = lazy(() => import('./pages/ValidatorPerformance'));
const ValidatorSetup = lazy(() => import('./pages/ValidatorSetup'));
const VendorAnalytics = lazy(() => import('./pages/VendorAnalytics'));
const VendorDirectory = lazy(() => import('./pages/VendorDirectory'));
const VendorOnboarding = lazy(() => import('./pages/VendorOnboarding'));
const VendorPerformance = lazy(() => import('./pages/VendorPerformance'));
const VendorVerification = lazy(() => import('./pages/VendorVerification'));
const VenueManagement = lazy(() => import('./pages/VenueManagement'));
const Verification = lazy(() => import('./pages/Verification'));
const VerificationSteps = lazy(() => import('./pages/VerificationSteps'));
const VerificationSystem = lazy(() => import('./pages/VerificationSystem'));
const VersionManagement = lazy(() => import('./pages/VersionManagement'));
const VestingSchedule = lazy(() => import('./pages/VestingSchedule'));
const VideoArea = lazy(() => import('./pages/VideoArea'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const VideoChat = lazy(() => import('./pages/VideoChat'));
const VideoEditor = lazy(() => import('./pages/VideoEditor'));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));
const VideoTools = lazy(() => import('./pages/VideoTools'));
const VideoTutorials = lazy(() => import('./pages/VideoTutorials'));
const VideoUpload = lazy(() => import('./pages/VideoUpload'));
const VideoUploader = lazy(() => import('./pages/VideoUploader'));
const ViewerMetrics = lazy(() => import('./pages/ViewerMetrics'));
const VirtualTour = lazy(() => import('./pages/VirtualTour'));
const VoiceCloning = lazy(() => import('./pages/VoiceCloning'));
const VoiceCommands = lazy(() => import('./pages/VoiceCommands'));
const VoiceCommandsRegistry = lazy(() => import('./pages/VoiceCommandsRegistry'));
const VoiceMessages = lazy(() => import('./pages/VoiceMessages'));
const WalkthroughPage = lazy(() => import('./pages/WalkthroughPage'));
const Wallet = lazy(() => import('./pages/Wallet'));
const WalletConnect = lazy(() => import('./pages/WalletConnect'));
const WalletIntegration = lazy(() => import('./pages/WalletIntegration'));
const WalletOverview = lazy(() => import('./pages/WalletOverview'));
const WarningDialog = lazy(() => import('./pages/WarningDialog'));
const WatchEarn = lazy(() => import('./pages/WatchEarn'));
const WatchList = lazy(() => import('./pages/WatchList'));
const WealthSimulator = lazy(() => import('./pages/WealthSimulator'));
const Web3Auth = lazy(() => import('./pages/Web3Auth'));
const WebhookManagement = lazy(() => import('./pages/WebhookManagement'));
const WebhookManager = lazy(() => import('./pages/WebhookManager'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const WelcomeScreen = lazy(() => import('./pages/WelcomeScreen'));
const WhaleMonitor = lazy(() => import('./pages/WhaleMonitor'));
const WhitelistManagement = lazy(() => import('./pages/WhitelistManagement'));
const WishlistManagement = lazy(() => import('./pages/WishlistManagement'));
const WorkflowAutomation = lazy(() => import('./pages/WorkflowAutomation'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const WorldBrain = lazy(() => import('./pages/WorldBrain'));
const WorldSimulationControl = lazy(() => import('./pages/WorldSimulationControl'));
const YieldFarming = lazy(() => import('./pages/YieldFarming'));
const ZapierIntegration = lazy(() => import('./pages/ZapierIntegration'));
const ZeroKnowledgeProof = lazy(() => import('./pages/ZeroKnowledgeProof'));
const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <ErrorBoundary>
          <div className="flex min-h-screen flex-col">
            <EnhancedNavbar />
            <MarketTicker />
            <main className="flex-1">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div><p className="text-gray-400">Loading...</p></div></div>}>
                <Switch>
          <Route path="/aBTesting" component={ABTesting} />
          <Route path="/aBTestingAdvanced" component={ABTestingAdvanced} />
          <Route path="/aIAgentEconomy" component={AIAgentEconomy} />
          <Route path="/aIAgentMarket" component={AIAgentMarket} />
          <Route path="/aIAssistant" component={AIAssistant} />
          <Route path="/aIBrain" component={AIBrain} />
          <Route path="/aICodeStudio" component={AICodeStudio} />
          <Route path="/aICopyStudio" component={AICopyStudio} />
          <Route path="/aICore" component={AICore} />
          <Route path="/aIEngineer" component={AIEngineer} />
          <Route path="/aIGovernance" component={AIGovernance} />
          <Route path="/aIMarketAgents" component={AIMarketAgents} />
          <Route path="/aIMatchmaker" component={AIMatchmaker} />
          <Route path="/aIModerationQueue" component={AIModerationQueue} />
          <Route path="/aIPersonaFeed" component={AIPersonaFeed} />
          <Route path="/aIPersonaSystem" component={AIPersonaSystem} />
          <Route path="/aIToolsHub" component={AIToolsHub} />
          <Route path="/aITrading" component={AITrading} />
          <Route path="/aITrainingLoops" component={AITrainingLoops} />
          <Route path="/aPIDocs" component={APIDocs} />
          <Route path="/aPIDocumentation" component={APIDocumentation} />
          <Route path="/aPIIntegration" component={APIIntegration} />
          <Route path="/aPIKeys" component={APIKeys} />
          <Route path="/aPILogs" component={APILogs} />
          <Route path="/aPIManagement" component={APIManagement} />
          <Route path="/aPIMonitoring" component={APIMonitoring} />
          <Route path="/aPIStatus" component={APIStatus} />
          <Route path="/aPITesting" component={APITesting} />
          <Route path="/aPIUsage" component={APIUsage} />
          <Route path="/aPIVersioning" component={APIVersioning} />
          <Route path="/aPYTracking" component={APYTracking} />
          <Route path="/about" component={About} />
          <Route path="/accessControl" component={AccessControl} />
          <Route path="/accessibilitySettings" component={AccessibilitySettings} />
          <Route path="/accordionNavigation" component={AccordionNavigation} />
          <Route path="/accountSettings" component={AccountSettings} />
          <Route path="/achievementBadges" component={AchievementBadges} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/actionObjects" component={ActionObjects} />
          <Route path="/actionPanel" component={ActionPanel} />
          <Route path="/activityFeed" component={ActivityFeed} />
          <Route path="/activityTracking" component={ActivityTracking} />
          <Route path="/adaptivePersonalization" component={AdaptivePersonalization} />
          <Route path="/adaptiveRoadmap" component={AdaptiveRoadmap} />
          <Route path="/addBankAccount" component={AddBankAccount} />
          <Route path="/addCreditCard" component={AddCreditCard} />
          <Route path="/addressBook" component={AddressBook} />
          <Route path="/addressLookup" component={AddressLookup} />
          <Route path="/admin" component={Admin} />
          <Route path="/adminDashboard" component={AdminDashboard} />
          <Route path="/adminOrders" component={AdminOrders} />
          <Route path="/adminPanel" component={AdminPanel} />
          <Route path="/adminWalletManager" component={AdminWalletManager} />
          <Route path="/advancedAdminPanel" component={AdvancedAdminPanel} />
          <Route path="/advancedAnalytics" component={AdvancedAnalytics} />
          <Route path="/advancedOrders" component={AdvancedOrders} />
          <Route path="/advancedSearch" component={AdvancedSearch} />
          <Route path="/affiliateDashboard" component={AffiliateDashboard} />
          <Route path="/affiliateProgram" component={AffiliateProgram} />
          <Route path="/ageGate" component={AgeGate} />
          <Route path="/ageVerification" component={AgeVerification} />
          <Route path="/agentBuilder" component={AgentBuilder} />
          <Route path="/agentCity" component={AgentCity} />
          <Route path="/agentCoordination" component={AgentCoordination} />
          <Route path="/agentCoordinationHub" component={AgentCoordinationHub} />
          <Route path="/agentDebate" component={AgentDebate} />
          <Route path="/agentDetail" component={AgentDetail} />
          <Route path="/agentMarketplace" component={AgentMarketplace} />
          <Route path="/agentPerformance" component={AgentPerformance} />
          <Route path="/agentSprint" component={AgentSprint} />
          <Route path="/agentsDashboard" component={AgentsDashboard} />
          <Route path="/alertConfiguration" component={AlertConfiguration} />
          <Route path="/alertDialog" component={AlertDialog} />
          <Route path="/alertManagement" component={AlertManagement} />
          <Route path="/ambientFeed" component={AmbientFeed} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/analyticsDashboard" component={AnalyticsDashboard} />
          <Route path="/analyticsProducts" component={AnalyticsProducts} />
          <Route path="/analyticsReports" component={AnalyticsReports} />
          <Route path="/anomalyDetection" component={AnomalyDetection} />
          <Route path="/antiSurveillance" component={AntiSurveillance} />
          <Route path="/approvalWorkflows" component={ApprovalWorkflows} />
          <Route path="/arbitrageBot" component={ArbitrageBot} />
          <Route path="/arcade" component={Arcade} />
          <Route path="/archiveManagement" component={ArchiveManagement} />
          <Route path="/assetAllocation" component={AssetAllocation} />
          <Route path="/assetManagement" component={AssetManagement} />
          <Route path="/assetTracking" component={AssetTracking} />
          <Route path="/assignmentTracker" component={AssignmentTracker} />
          <Route path="/attributionModeling" component={AttributionModeling} />
          <Route path="/audienceSegmentation" component={AudienceSegmentation} />
          <Route path="/audioAnalytics" component={AudioAnalytics} />
          <Route path="/audioEditing" component={AudioEditing} />
          <Route path="/audioLibrary" component={AudioLibrary} />
          <Route path="/audioPlayer" component={AudioPlayer} />
          <Route path="/auditLog" component={AuditLog} />
          <Route path="/auditLogs" component={AuditLogs} />
          <Route path="/auditTrail" component={AuditTrail} />
          <Route path="/autoResponder" component={AutoResponder} />
          <Route path="/automationEngine" component={AutomationEngine} />
          <Route path="/automationRules" component={AutomationRules} />
          <Route path="/automationWorkflows" component={AutomationWorkflows} />
          <Route path="/backupManagement" component={BackupManagement} />
          <Route path="/badges" component={Badges} />
          <Route path="/banSuspendUser" component={BanSuspendUser} />
          <Route path="/batchGeneration" component={BatchGeneration} />
          <Route path="/battlePass" component={BattlePass} />
          <Route path="/behavioralIntelligence" component={BehavioralIntelligence} />
          <Route path="/beta" component={Beta} />
          <Route path="/billingHistory" component={BillingHistory} />
          <Route path="/blockBrowser" component={BlockBrowser} />
          <Route path="/blockRewards" component={BlockRewards} />
          <Route path="/blockUser" component={BlockUser} />
          <Route path="/blockchainCustody" component={BlockchainCustody} />
          <Route path="/blockchainMonitor" component={BlockchainMonitor} />
          <Route path="/blockedUsers" component={BlockedUsers} />
          <Route path="/blogEditor" component={BlogEditor} />
          <Route path="/blogPublisher" component={BlogPublisher} />
          <Route path="/bookPage" component={BookPage} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/bountySystem" component={BountySystem} />
          <Route path="/brandGuidelines" component={BrandGuidelines} />
          <Route path="/breadcrumbNavigation" component={BreadcrumbNavigation} />
          <Route path="/bridgeProtocol" component={BridgeProtocol} />
          <Route path="/bridgeTransactions" component={BridgeTransactions} />
          <Route path="/browserExtension" component={BrowserExtension} />
          <Route path="/budgetPlanner" component={BudgetPlanner} />
          <Route path="/bugReporting" component={BugReporting} />
          <Route path="/buildOrder" component={BuildOrder} />
          <Route path="/buildRoadmap" component={BuildRoadmap} />
          <Route path="/bulkOperations" component={BulkOperations} />
          <Route path="/bulkOrdering" component={BulkOrdering} />
          <Route path="/bulkUpload" component={BulkUpload} />
          <Route path="/cCPA" component={CCPA} />
          <Route path="/cDNManagement" component={CDNManagement} />
          <Route path="/cRM" component={CRM} />
          <Route path="/cacheManagement" component={CacheManagement} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/calendarView" component={CalendarView} />
          <Route path="/campaignAnalytics" component={CampaignAnalytics} />
          <Route path="/campaignBuilder" component={CampaignBuilder} />
          <Route path="/campaignCreation" component={CampaignCreation} />
          <Route path="/carRental" component={CarRental} />
          <Route path="/cardGridView" component={CardGridView} />
          <Route path="/cashFlowAnalysis" component={CashFlowAnalysis} />
          <Route path="/categoryManagement" component={CategoryManagement} />
          <Route path="/certificateManager" component={CertificateManager} />
          <Route path="/chainExplorer" component={ChainExplorer} />
          <Route path="/changeLog" component={ChangeLog} />
          <Route path="/channelCustomization" component={ChannelCustomization} />
          <Route path="/charity" component={Charity} />
          <Route path="/charityLeaderboard" component={CharityLeaderboard} />
          <Route path="/chartAnalysis" component={ChartAnalysis} />
          <Route path="/chartDashboard" component={ChartDashboard} />
          <Route path="/chatBot" component={ChatBot} />
          <Route path="/chatHistory" component={ChatHistory} />
          <Route path="/chatMVP" component={ChatMVP} />
          <Route path="/checkboxGroupForm" component={CheckboxGroupForm} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkoutFlow" component={CheckoutFlow} />
          <Route path="/chinaEdition" component={ChinaEdition} />
          <Route path="/churnPrediction" component={ChurnPrediction} />
          <Route path="/citizenPassport" component={CitizenPassport} />
          <Route path="/civilizationSimulator" component={CivilizationSimulator} />
          <Route path="/clanWars" component={ClanWars} />
          <Route path="/classroomManagement" component={ClassroomManagement} />
          <Route path="/clientLibraries" component={ClientLibraries} />
          <Route path="/closingChecklist" component={ClosingChecklist} />
          <Route path="/codeCompletion" component={CodeCompletion} />
          <Route path="/codeFormatter" component={CodeFormatter} />
          <Route path="/codeHighlighting" component={CodeHighlighting} />
          <Route path="/codeQuality" component={CodeQuality} />
          <Route path="/codeQualityDashboard" component={CodeQualityDashboard} />
          <Route path="/codeRepository" component={CodeRepository} />
          <Route path="/codeSamples" component={CodeSamples} />
          <Route path="/cohortAnalysis" component={CohortAnalysis} />
          <Route path="/colorPickerDialog" component={ColorPickerDialog} />
          <Route path="/commentThread" component={CommentThread} />
          <Route path="/comments" component={Comments} />
          <Route path="/commentsSection" component={CommentsSection} />
          <Route path="/commissionManagement" component={CommissionManagement} />
          <Route path="/community" component={Community} />
          <Route path="/communityCreate" component={CommunityCreate} />
          <Route path="/communityEngagement" component={CommunityEngagement} />
          <Route path="/communityGuidelines" component={CommunityGuidelines} />
          <Route path="/communityHub" component={CommunityHub} />
          <Route path="/companySimulator" component={CompanySimulator} />
          <Route path="/competitiveRadar" component={CompetitiveRadar} />
          <Route path="/complianceCenter" component={ComplianceCenter} />
          <Route path="/complianceChecker" component={ComplianceChecker} />
          <Route path="/complianceChecking" component={ComplianceChecking} />
          <Route path="/complianceDashboard" component={ComplianceDashboard} />
          <Route path="/complianceReports" component={ComplianceReports} />
          <Route path="/componentShowcase" component={ComponentShowcase} />
          <Route path="/comprehensiveEcosystemLanding" component={ComprehensiveEcosystemLanding} />
          <Route path="/confirmationDialog" component={ConfirmationDialog} />
          <Route path="/connectedApps" component={ConnectedApps} />
          <Route path="/connectionError" component={ConnectionError} />
          <Route path="/connectionRequests" component={ConnectionRequests} />
          <Route path="/connectorIntelligence" component={ConnectorIntelligence} />
          <Route path="/contactManagement" component={ContactManagement} />
          <Route path="/contactUsForm" component={ContactUsForm} />
          <Route path="/contentAnalytics" component={ContentAnalytics} />
          <Route path="/contentCalendar" component={ContentCalendar} />
          <Route path="/contentCollaboration" component={ContentCollaboration} />
          <Route path="/contentFlagging" component={ContentFlagging} />
          <Route path="/contentLibrary" component={ContentLibrary} />
          <Route path="/contentModeration" component={ContentModeration} />
          <Route path="/contentScheduler" component={ContentScheduler} />
          <Route path="/contentScheduling" component={ContentScheduling} />
          <Route path="/contentUpload" component={ContentUpload} />
          <Route path="/contentVault" component={ContentVault} />
          <Route path="/contextMenu" component={ContextMenu} />
          <Route path="/contractABI" component={ContractABI} />
          <Route path="/contractManagement" component={ContractManagement} />
          <Route path="/contributionInterface" component={ContributionInterface} />
          <Route path="/conversationArchive" component={ConversationArchive} />
          <Route path="/conversationHistory" component={ConversationHistory} />
          <Route path="/conversionFunnel" component={ConversionFunnel} />
          <Route path="/conversionOptimization" component={ConversionOptimization} />
          <Route path="/cookiePolicy" component={CookiePolicy} />
          <Route path="/copyrightManagement" component={CopyrightManagement} />
          <Route path="/costAllocation" component={CostAllocation} />
          <Route path="/costBasisCalculation" component={CostBasisCalculation} />
          <Route path="/courseBuilder" component={CourseBuilder} />
          <Route path="/courseCatalog" component={CourseCatalog} />
          <Route path="/coverPhoto" component={CoverPhoto} />
          <Route path="/createArticle" component={CreateArticle} />
          <Route path="/createAudio" component={CreateAudio} />
          <Route path="/createDrop" component={CreateDrop} />
          <Route path="/createReel" component={CreateReel} />
          <Route path="/creatorAnalytics" component={CreatorAnalytics} />
          <Route path="/creatorDashboard" component={CreatorDashboard} />
          <Route path="/creatorEconomy" component={CreatorEconomy} />
          <Route path="/creatorFunding" component={CreatorFunding} />
          <Route path="/creatorGrants" component={CreatorGrants} />
          <Route path="/creatorIntelligence" component={CreatorIntelligence} />
          <Route path="/creatorMonetization" component={CreatorMonetization} />
          <Route path="/creatorNetwork" component={CreatorNetwork} />
          <Route path="/creatorOnboarding" component={CreatorOnboarding} />
          <Route path="/creatorProfile" component={CreatorProfile} />
          <Route path="/creatorSpotlight" component={CreatorSpotlight} />
          <Route path="/creatorStudio" component={CreatorStudio} />
          <Route path="/crossChainInterop" component={CrossChainInterop} />
          <Route path="/crossChainSwap" component={CrossChainSwap} />
          <Route path="/crypto" component={Crypto} />
          <Route path="/cryptoEnhancementsPage" component={CryptoEnhancementsPage} />
          <Route path="/cryptoExchange" component={CryptoExchange} />
          <Route path="/cryptoHub" component={CryptoHub} />
          <Route path="/cryptoNews" component={CryptoNews} />
          <Route path="/cryptoResearchHub" component={CryptoResearchHub} />
          <Route path="/customDashboard" component={CustomDashboard} />
          <Route path="/customReports" component={CustomReports} />
          <Route path="/customerAnalytics" component={CustomerAnalytics} />
          <Route path="/customerDisputes" component={CustomerDisputes} />
          <Route path="/dAOGovernance" component={DAOGovernance} />
          <Route path="/dAOTreasury" component={DAOTreasury} />
          <Route path="/dCACalculator" component={DCACalculator} />
          <Route path="/dEXDepthChart" component={DEXDepthChart} />
          <Route path="/dMInbox" component={DMInbox} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboardOverview" component={DashboardOverview} />
          <Route path="/dataExport" component={DataExport} />
          <Route path="/dataGrid" component={DataGrid} />
          <Route path="/dataLake" component={DataLake} />
          <Route path="/dataPrivacy" component={DataPrivacy} />
          <Route path="/dataProcessing" component={DataProcessing} />
          <Route path="/dataRetention" component={DataRetention} />
          <Route path="/dataTable" component={DataTable} />
          <Route path="/dataVisualization" component={DataVisualization} />
          <Route path="/databaseManagement" component={DatabaseManagement} />
          <Route path="/dateInputForm" component={DateInputForm} />
          <Route path="/datePickerDialog" component={DatePickerDialog} />
          <Route path="/datingDiscovery" component={DatingDiscovery} />
          <Route path="/datingHome" component={DatingHome} />
          <Route path="/datingMatches" component={DatingMatches} />
          <Route path="/datingMessages" component={DatingMessages} />
          <Route path="/datingPremium" component={DatingPremium} />
          <Route path="/datingProfile" component={DatingProfile} />
          <Route path="/datingProfileSetup" component={DatingProfileSetup} />
          <Route path="/datingSubscription" component={DatingSubscription} />
          <Route path="/dayTradeRoom" component={DayTradeRoom} />
          <Route path="/deFi" component={DeFi} />
          <Route path="/decentralizedIdentity" component={DecentralizedIdentity} />
          <Route path="/defensibilityMoat" component={DefensibilityMoat} />
          <Route path="/deleteAccount" component={DeleteAccount} />
          <Route path="/deleteContent" component={DeleteContent} />
          <Route path="/departmentManagement" component={DepartmentManagement} />
          <Route path="/dependencyGraph" component={DependencyGraph} />
          <Route path="/deploymentPipeline" component={DeploymentPipeline} />
          <Route path="/deprecationPolicy" component={DeprecationPolicy} />
          <Route path="/derivativeTrading" component={DerivativeTrading} />
          <Route path="/derivativesTrading" component={DerivativesTrading} />
          <Route path="/destinationGuide" component={DestinationGuide} />
          <Route path="/destinyEngine" component={DestinyEngine} />
          <Route path="/devOps" component={DevOps} />
          <Route path="/developerArea" component={DeveloperArea} />
          <Route path="/developerCommunity" component={DeveloperCommunity} />
          <Route path="/developerMarketplace" component={DeveloperMarketplace} />
          <Route path="/developerProtocol" component={DeveloperProtocol} />
          <Route path="/difficultyCalculator" component={DifficultyCalculator} />
          <Route path="/difficultyTracking" component={DifficultyTracking} />
          <Route path="/digitalArtStore" component={DigitalArtStore} />
          <Route path="/digitalNationMode" component={DigitalNationMode} />
          <Route path="/digitalTwin" component={DigitalTwin} />
          <Route path="/directMessages" component={DirectMessages} />
          <Route path="/directMessaging" component={DirectMessaging} />
          <Route path="/disasterRecovery" component={DisasterRecovery} />
          <Route path="/discordIntegration" component={DiscordIntegration} />
          <Route path="/discover" component={Discover} />
          <Route path="/discussionBoard" component={DiscussionBoard} />
          <Route path="/discussionForums" component={DiscussionForums} />
          <Route path="/disputeResolution" component={DisputeResolution} />
          <Route path="/distributionChannels" component={DistributionChannels} />
          <Route path="/documentEditor" component={DocumentEditor} />
          <Route path="/documentManagement" component={DocumentManagement} />
          <Route path="/documentSharing" component={DocumentSharing} />
          <Route path="/documentSigning" component={DocumentSigning} />
          <Route path="/documentation" component={Documentation} />
          <Route path="/dogecoinPoolSelection" component={DogecoinPoolSelection} />
          <Route path="/domainManagement" component={DomainManagement} />
          <Route path="/donationProcessing" component={DonationProcessing} />
          <Route path="/dropdownMenu" component={DropdownMenu} />
          <Route path="/eNSResolver" component={ENSResolver} />
          <Route path="/earningsTracker" component={EarningsTracker} />
          <Route path="/earningsTracking" component={EarningsTracking} />
          <Route path="/economicLayer" component={EconomicLayer} />
          <Route path="/economics" component={Economics} />
          <Route path="/economyControl" component={EconomyControl} />
          <Route path="/ecosystem" component={Ecosystem} />
          <Route path="/editProfile" component={EditProfile} />
          <Route path="/emailCampaigns" component={EmailCampaigns} />
          <Route path="/emailConfiguration" component={EmailConfiguration} />
          <Route path="/emailInputForm" component={EmailInputForm} />
          <Route path="/emailIntegration" component={EmailIntegration} />
          <Route path="/emailNotifications" component={EmailNotifications} />
          <Route path="/emailTemplates" component={EmailTemplates} />
          <Route path="/emailVerification" component={EmailVerification} />
          <Route path="/embedSDK" component={EmbedSDK} />
          <Route path="/emptySearchState" component={EmptySearchState} />
          <Route path="/engagementMetrics" component={EngagementMetrics} />
          <Route path="/engagementStats" component={EngagementStats} />
          <Route path="/engineer" component={Engineer} />
          <Route path="/enterprise" component={Enterprise} />
          <Route path="/enterpriseAPI" component={EnterpriseAPI} />
          <Route path="/enterpriseAnalytics" component={EnterpriseAnalytics} />
          <Route path="/enterpriseBilling" component={EnterpriseBilling} />
          <Route path="/entityProfile" component={EntityProfile} />
          <Route path="/environmentManagement" component={EnvironmentManagement} />
          <Route path="/error403" component={Error403} />
          <Route path="/error404" component={Error404} />
          <Route path="/error500" component={Error500} />
          <Route path="/error503" component={Error503} />
          <Route path="/errorDialog" component={ErrorDialog} />
          <Route path="/errorTracking" component={ErrorTracking} />
          <Route path="/escrowShop" component={EscrowShop} />
          <Route path="/ethereumPoolSelector" component={EthereumPoolSelector} />
          <Route path="/eventAnalytics" component={EventAnalytics} />
          <Route path="/eventCalendar" component={EventCalendar} />
          <Route path="/eventCreation" component={EventCreation} />
          <Route path="/eventPlanner" component={EventPlanner} />
          <Route path="/eventRegistration" component={EventRegistration} />
          <Route path="/events" component={Events} />
          <Route path="/executionHistory" component={ExecutionHistory} />
          <Route path="/exerciseLibrary" component={ExerciseLibrary} />
          <Route path="/expenseManagement" component={ExpenseManagement} />
          <Route path="/expenseTracker" component={ExpenseTracker} />
          <Route path="/experimentFactory" component={ExperimentFactory} />
          <Route path="/experimentTracker" component={ExperimentTracker} />
          <Route path="/explore" component={Explore} />
          <Route path="/exportData" component={ExportData} />
          <Route path="/fAQManagement" component={FAQManagement} />
          <Route path="/fAQPage" component={FAQPage} />
          <Route path="/farming" component={Farming} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/featureRequests" component={FeatureRequests} />
          <Route path="/featureTour" component={FeatureTour} />
          <Route path="/features" component={Features} />
          <Route path="/feeCalculation" component={FeeCalculation} />
          <Route path="/feedWithPosts" component={FeedWithPosts} />
          <Route path="/feedback" component={Feedback} />
          <Route path="/feedbackDialog" component={FeedbackDialog} />
          <Route path="/feedbackForm" component={FeedbackForm} />
          <Route path="/feedbackHub" component={FeedbackHub} />
          <Route path="/fileBrowser" component={FileBrowser} />
          <Route path="/fileConverter" component={FileConverter} />
          <Route path="/fileDownload" component={FileDownload} />
          <Route path="/filePreview" component={FilePreview} />
          <Route path="/fileSharing" component={FileSharing} />
          <Route path="/fileUploadDialog" component={FileUploadDialog} />
          <Route path="/fileUploadForm" component={FileUploadForm} />
          <Route path="/fileUploadProgress" component={FileUploadProgress} />
          <Route path="/fileVersioning" component={FileVersioning} />
          <Route path="/filterPanel" component={FilterPanel} />
          <Route path="/financialReports" component={FinancialReports} />
          <Route path="/flashLoans" component={FlashLoans} />
          <Route path="/flightSearch" component={FlightSearch} />
          <Route path="/followList" component={FollowList} />
          <Route path="/followRequests" component={FollowRequests} />
          <Route path="/followSystem" component={FollowSystem} />
          <Route path="/followUnfollow" component={FollowUnfollow} />
          <Route path="/followerList" component={FollowerList} />
          <Route path="/followersNetwork" component={FollowersNetwork} />
          <Route path="/forecastingEngine" component={ForecastingEngine} />
          <Route path="/forumCategories" component={ForumCategories} />
          <Route path="/frameworkTemplates" component={FrameworkTemplates} />
          <Route path="/freeWillDashboard" component={FreeWillDashboard} />
          <Route path="/fundraiserTools" component={FundraiserTools} />
          <Route path="/gDPR" component={GDPR} />
          <Route path="/gTMStrategy" component={GTMStrategy} />
          <Route path="/gainLossTracking" component={GainLossTracking} />
          <Route path="/gameBlackjack" component={GameBlackjack} />
          <Route path="/gameBlockBuilder" component={GameBlockBuilder} />
          <Route path="/gameChat" component={GameChat} />
          <Route path="/gameCrash" component={GameCrash} />
          <Route path="/gameCryptoQuiz" component={GameCryptoQuiz} />
          <Route path="/gameFiQuestBoard" component={GameFiQuestBoard} />
          <Route path="/gameLobby" component={GameLobby} />
          <Route path="/gameRoom" component={GameRoom} />
          <Route path="/gameSettings" component={GameSettings} />
          <Route path="/gameSlots" component={GameSlots} />
          <Route path="/gameTokenTap" component={GameTokenTap} />
          <Route path="/gaming" component={Gaming} />
          <Route path="/gamingForCharity" component={GamingForCharity} />
          <Route path="/ganttChart" component={GanttChart} />
          <Route path="/gasFeeEstimator" component={GasFeeEstimator} />
          <Route path="/gasPriceMonitor" component={GasPriceMonitor} />
          <Route path="/gasTracker" component={GasTracker} />
          <Route path="/generalSettings" component={GeneralSettings} />
          <Route path="/generatedApiExplorer" component={GeneratedApiExplorer} />
          <Route path="/generatedGallery" component={GeneratedGallery} />
          <Route path="/gettingStartedGuide" component={GettingStartedGuide} />
          <Route path="/ghostMode" component={GhostMode} />
          <Route path="/globalOperationsCenter" component={GlobalOperationsCenter} />
          <Route path="/globalSearch" component={GlobalSearch} />
          <Route path="/governance" component={Governance} />
          <Route path="/governanceVoting" component={GovernanceVoting} />
          <Route path="/governanceWizard" component={GovernanceWizard} />
          <Route path="/gradeBook" component={GradeBook} />
          <Route path="/groupChat" component={GroupChat} />
          <Route path="/groupChats" component={GroupChats} />
          <Route path="/groupDirectory" component={GroupDirectory} />
          <Route path="/groupEvents" component={GroupEvents} />
          <Route path="/groupManagement" component={GroupManagement} />
          <Route path="/growth" component={Growth} />
          <Route path="/guilds" component={Guilds} />
          <Route path="/hIPAA" component={HIPAA} />
          <Route path="/hOPEAIControl" component={HOPEAIControl} />
          <Route path="/hashRateMonitor" component={HashRateMonitor} />
          <Route path="/hashtagExplorer" component={HashtagExplorer} />
          <Route path="/hashtagSearch" component={HashtagSearch} />
          <Route path="/hashtags" component={Hashtags} />
          <Route path="/healthArticles" component={HealthArticles} />
          <Route path="/healthDashboard" component={HealthDashboard} />
          <Route path="/healthGoals" component={HealthGoals} />
          <Route path="/helpCenter" component={HelpCenter} />
          <Route path="/hopeAI" component={HopeAI} />
          <Route path="/hopeAIAdvanced" component={HopeAIAdvanced} />
          <Route path="/hopeAIMeta" component={HopeAIMeta} />
          <Route path="/hopeAIPage" component={HopeAIPage} />
          <Route path="/hopeAIUpgrades" component={HopeAIUpgrades} />
          <Route path="/hotelSearch" component={HotelSearch} />
          <Route path="/hubSpotIntegration" component={HubSpotIntegration} />
          <Route path="/iCOLaunchpad" component={ICOLaunchpad} />
          <Route path="/iFTTT" component={IFTTT} />
          <Route path="/iITR" component={IITR} />
          <Route path="/iTServicesLanding" component={ITServicesLanding} />
          <Route path="/iTServicesPortal" component={ITServicesPortal} />
          <Route path="/imageEditor" component={ImageEditor} />
          <Route path="/imageGallery" component={ImageGallery} />
          <Route path="/imageTools" component={ImageTools} />
          <Route path="/imageViewer" component={ImageViewer} />
          <Route path="/impactMap" component={ImpactMap} />
          <Route path="/impactMetrics" component={ImpactMetrics} />
          <Route path="/inAppNotifications" component={InAppNotifications} />
          <Route path="/inGameCurrency" component={InGameCurrency} />
          <Route path="/incidentManagement" component={IncidentManagement} />
          <Route path="/inputDialog" component={InputDialog} />
          <Route path="/instructorDashboard" component={InstructorDashboard} />
          <Route path="/integrationSetup" component={IntegrationSetup} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/inventoryManagement" component={InventoryManagement} />
          <Route path="/investmentGoals" component={InvestmentGoals} />
          <Route path="/investorMetrics" component={InvestorMetrics} />
          <Route path="/investorPitch" component={InvestorPitch} />
          <Route path="/investorPortal" component={InvestorPortal} />
          <Route path="/investorRoom" component={InvestorRoom} />
          <Route path="/invoiceDetails" component={InvoiceDetails} />
          <Route path="/invoiceManagement" component={InvoiceManagement} />
          <Route path="/kYCVerification" component={KYCVerification} />
          <Route path="/knowledgeBase" component={KnowledgeBase} />
          <Route path="/lDAPIntegration" component={LDAPIntegration} />
          <Route path="/lTVAnalysis" component={LTVAnalysis} />
          <Route path="/landingPage" component={LandingPage} />
          <Route path="/languageExchangeAdmin" component={LanguageExchangeAdmin} />
          <Route path="/languagePartnerDiscovery" component={LanguagePartnerDiscovery} />
          <Route path="/languageSelector" component={LanguageSelector} />
          <Route path="/languageSettings" component={LanguageSettings} />
          <Route path="/leadScoring" component={LeadScoring} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/leaderboards" component={Leaderboards} />
          <Route path="/learning" component={Learning} />
          <Route path="/learningPath" component={LearningPath} />
          <Route path="/legalDocuments" component={LegalDocuments} />
          <Route path="/legendaryStatus" component={LegendaryStatus} />
          <Route path="/lendingBorrow" component={LendingBorrow} />
          <Route path="/lendingBorrowing" component={LendingBorrowing} />
          <Route path="/lessonEditor" component={LessonEditor} />
          <Route path="/lifeCommand" component={LifeCommand} />
          <Route path="/lightbox" component={Lightbox} />
          <Route path="/likeReactionSystem" component={LikeReactionSystem} />
          <Route path="/likes" component={Likes} />
          <Route path="/liquidStaking" component={LiquidStaking} />
          <Route path="/liquidityPools" component={LiquidityPools} />
          <Route path="/listView" component={ListView} />
          <Route path="/live" component={Live} />
          <Route path="/liveChat" component={LiveChat} />
          <Route path="/liveGifting" component={LiveGifting} />
          <Route path="/liveReactions" component={LiveReactions} />
          <Route path="/liveStreamSetup" component={LiveStreamSetup} />
          <Route path="/liveStreaming" component={LiveStreaming} />
          <Route path="/livestreamDashboard" component={LivestreamDashboard} />
          <Route path="/loadBalancing" component={LoadBalancing} />
          <Route path="/loadingDialog" component={LoadingDialog} />
          <Route path="/logViewer" component={LogViewer} />
          <Route path="/login" component={Login} />
          <Route path="/logisticsOptimizer" component={LogisticsOptimizer} />
          <Route path="/mLInsights" component={MLInsights} />
          <Route path="/mLModels" component={MLModels} />
          <Route path="/mailingLists" component={MailingLists} />
          <Route path="/mainDashboard" component={MainDashboard} />
          <Route path="/maintenanceMode" component={MaintenanceMode} />
          <Route path="/mapView" component={MapView} />
          <Route path="/marginTrading" component={MarginTrading} />
          <Route path="/markdownRendering" component={MarkdownRendering} />
          <Route path="/marketSentiment" component={MarketSentiment} />
          <Route path="/marketingROI" component={MarketingROI} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/marketplaceAnalytics" component={MarketplaceAnalytics} />
          <Route path="/masterArchitecture" component={MasterArchitecture} />
          <Route path="/matchChat" component={MatchChat} />
          <Route path="/matchFeed" component={MatchFeed} />
          <Route path="/matchSpace" component={MatchSpace} />
          <Route path="/matchingAlgorithm" component={MatchingAlgorithm} />
          <Route path="/matchmaking" component={Matchmaking} />
          <Route path="/mealPlans" component={MealPlans} />
          <Route path="/mediaCarousel" component={MediaCarousel} />
          <Route path="/mediaGallery" component={MediaGallery} />
          <Route path="/medicationReminder" component={MedicationReminder} />
          <Route path="/megaMarketplace" component={MegaMarketplace} />
          <Route path="/membershipTiers" component={MembershipTiers} />
          <Route path="/memoryConstellation" component={MemoryConstellation} />
          <Route path="/memoryGraphVisualizer" component={MemoryGraphVisualizer} />
          <Route path="/memorySystem" component={MemorySystem} />
          <Route path="/mentions" component={Mentions} />
          <Route path="/messageEncryption" component={MessageEncryption} />
          <Route path="/messageSearch" component={MessageSearch} />
          <Route path="/messages" component={Messages} />
          <Route path="/metaversePortal" component={MetaversePortal} />
          <Route path="/milestoneTracking" component={MilestoneTracking} />
          <Route path="/minerDashboard" component={MinerDashboard} />
          <Route path="/miningCalculator" component={MiningCalculator} />
          <Route path="/miningDashboard" component={MiningDashboard} />
          <Route path="/miningPoolSelector" component={MiningPoolSelector} />
          <Route path="/missionControl" component={MissionControl} />
          <Route path="/mobile" component={Mobile} />
          <Route path="/mobileApp" component={MobileApp} />
          <Route path="/mobileGaming" component={MobileGaming} />
          <Route path="/mobileHome" component={MobileHome} />
          <Route path="/mobileMenu" component={MobileMenu} />
          <Route path="/mobileMessages" component={MobileMessages} />
          <Route path="/mobileNotifications" component={MobileNotifications} />
          <Route path="/mobileProfile" component={MobileProfile} />
          <Route path="/mobileSearch" component={MobileSearch} />
          <Route path="/mobileSettings" component={MobileSettings} />
          <Route path="/mobileShop" component={MobileShop} />
          <Route path="/mobileStreaming" component={MobileStreaming} />
          <Route path="/mobileTrading" component={MobileTrading} />
          <Route path="/mobileWallet" component={MobileWallet} />
          <Route path="/moderationDashboard" component={ModerationDashboard} />
          <Route path="/monetization" component={Monetization} />
          <Route path="/moodTracker" component={MoodTracker} />
          <Route path="/mortgageCalculator" component={MortgageCalculator} />
          <Route path="/movieCatalog" component={MovieCatalog} />
          <Route path="/movieDetail" component={MovieDetail} />
          <Route path="/multiModelSelector" component={MultiModelSelector} />
          <Route path="/multiSelectForm" component={MultiSelectForm} />
          <Route path="/multiplayerLobby" component={MultiplayerLobby} />
          <Route path="/multivariateTesting" component={MultivariateTesting} />
          <Route path="/musicGeneration" component={MusicGeneration} />
          <Route path="/mutualConnections" component={MutualConnections} />
          <Route path="/mutualFriends" component={MutualFriends} />
          <Route path="/myLearning" component={MyLearning} />
          <Route path="/myTrips" component={MyTrips} />
          <Route path="/nFTGallery" component={NFTGallery} />
          <Route path="/nFTMinting" component={NFTMinting} />
          <Route path="/nFTWallet" component={NFTWallet} />
          <Route path="/nLPTools" component={NLPTools} />
          <Route path="/nSFWFeed" component={NSFWFeed} />
          <Route path="/nSFWPlatform" component={NSFWPlatform} />
          <Route path="/narrativeEngine" component={NarrativeEngine} />
          <Route path="/netWorthTracker" component={NetWorthTracker} />
          <Route path="/networkGraph" component={NetworkGraph} />
          <Route path="/networkHealth" component={NetworkHealth} />
          <Route path="/networkStatistics" component={NetworkStatistics} />
          <Route path="/notesApp" component={NotesApp} />
          <Route path="/notificationCenter" component={NotificationCenter} />
          <Route path="/notificationHistory" component={NotificationHistory} />
          <Route path="/notificationIntelligence" component={NotificationIntelligence} />
          <Route path="/notificationPreferences" component={NotificationPreferences} />
          <Route path="/notificationSettings" component={NotificationSettings} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/notificationsCenter" component={NotificationsCenter} />
          <Route path="/notificationsHub" component={NotificationsHub} />
          <Route path="/numberInputForm" component={NumberInputForm} />
          <Route path="/nutritionTracker" component={NutritionTracker} />
          <Route path="/oAuthProviders" component={OAuthProviders} />
          <Route path="/offerManagement" component={OfferManagement} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/onboardingTutorial" component={OnboardingTutorial} />
          <Route path="/optionsTrading" component={OptionsTrading} />
          <Route path="/oracleNetwork" component={OracleNetwork} />
          <Route path="/orderBook" component={OrderBook} />
          <Route path="/orderConfirmation" component={OrderConfirmation} />
          <Route path="/orderHistory" component={OrderHistory} />
          <Route path="/orderPlacement" component={OrderPlacement} />
          <Route path="/orderTracking" component={OrderTracking} />
          <Route path="/orderTypes" component={OrderTypes} />
          <Route path="/organizationSettings" component={OrganizationSettings} />
          <Route path="/p2EShop" component={P2EShop} />
          <Route path="/pagination" component={Pagination} />
          <Route path="/passwordInputForm" component={PasswordInputForm} />
          <Route path="/passwordReset" component={PasswordReset} />
          <Route path="/payPalIntegration" component={PayPalIntegration} />
          <Route path="/paymentConfirmation" component={PaymentConfirmation} />
          <Route path="/paymentInfra" component={PaymentInfra} />
          <Route path="/paymentMethods" component={PaymentMethods} />
          <Route path="/paymentSetup" component={PaymentSetup} />
          <Route path="/payments" component={Payments} />
          <Route path="/payoutDashboard" component={PayoutDashboard} />
          <Route path="/payoutManagement" component={PayoutManagement} />
          <Route path="/performanceMetrics" component={PerformanceMetrics} />
          <Route path="/performanceTuning" component={PerformanceTuning} />
          <Route path="/permissionManagement" component={PermissionManagement} />
          <Route path="/perpetualFutures" component={PerpetualFutures} />
          <Route path="/personaBuilder" component={PersonaBuilder} />
          <Route path="/phase1Dashboard" component={Phase1Dashboard} />
          <Route path="/phase2to4Dashboard" component={Phase2to4Dashboard} />
          <Route path="/phoneVerification" component={PhoneVerification} />
          <Route path="/platformMap" component={PlatformMap} />
          <Route path="/platformStatus" component={PlatformStatus} />
          <Route path="/playlistManagement" component={PlaylistManagement} />
          <Route path="/playlistManager" component={PlaylistManager} />
          <Route path="/podcastStudio" component={PodcastStudio} />
          <Route path="/policyManagement" component={PolicyManagement} />
          <Route path="/poolPerformance" component={PoolPerformance} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/portfolioComparison" component={PortfolioComparison} />
          <Route path="/portfolioOptimization" component={PortfolioOptimization} />
          <Route path="/portfolioOverview" component={PortfolioOverview} />
          <Route path="/portfolioRebalance" component={PortfolioRebalance} />
          <Route path="/portfolioTracker" component={PortfolioTracker} />
          <Route path="/portfolioTracking" component={PortfolioTracking} />
          <Route path="/positionManagement" component={PositionManagement} />
          <Route path="/powerUserTools" component={PowerUserTools} />
          <Route path="/practiceSessions" component={PracticeSessions} />
          <Route path="/predictiveAnalytics" component={PredictiveAnalytics} />
          <Route path="/predictiveModels" component={PredictiveModels} />
          <Route path="/predictiveSystems" component={PredictiveSystems} />
          <Route path="/preferencesSetup" component={PreferencesSetup} />
          <Route path="/premiumFeatures" component={PremiumFeatures} />
          <Route path="/presentationWithChat" component={PresentationWithChat} />
          <Route path="/priceAlerts" component={PriceAlerts} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/pricingEngine" component={PricingEngine} />
          <Route path="/pricingManagement" component={PricingManagement} />
          <Route path="/pricingRules" component={PricingRules} />
          <Route path="/priorityMatrix" component={PriorityMatrix} />
          <Route path="/privacyMixer" component={PrivacyMixer} />
          <Route path="/privacyPolicy" component={PrivacyPolicy} />
          <Route path="/privacySettings" component={PrivacySettings} />
          <Route path="/privacyVault" component={PrivacyVault} />
          <Route path="/productApproval" component={ProductApproval} />
          <Route path="/productBrain" component={ProductBrain} />
          <Route path="/productCatalog" component={ProductCatalog} />
          <Route path="/productComparison" component={ProductComparison} />
          <Route path="/productDetail" component={ProductDetail} />
          <Route path="/productListing" component={ProductListing} />
          <Route path="/productListings" component={ProductListings} />
          <Route path="/productReviews" component={ProductReviews} />
          <Route path="/productionArchitecture" component={ProductionArchitecture} />
          <Route path="/profile" component={Profile} />
          <Route path="/profileCompletion" component={ProfileCompletion} />
          <Route path="/profileCreation" component={ProfileCreation} />
          <Route path="/profileCustomization" component={ProfileCustomization} />
          <Route path="/profileDashboard" component={ProfileDashboard} />
          <Route path="/profileEdit" component={ProfileEdit} />
          <Route path="/profilePicture" component={ProfilePicture} />
          <Route path="/profilePreview" component={ProfilePreview} />
          <Route path="/profileView" component={ProfileView} />
          <Route path="/profileWallet" component={ProfileWallet} />
          <Route path="/profitability" component={Profitability} />
          <Route path="/progressBar" component={ProgressBar} />
          <Route path="/progressTracking" component={ProgressTracking} />
          <Route path="/projectBoard" component={ProjectBoard} />
          <Route path="/projectListing" component={ProjectListing} />
          <Route path="/promotionEngine" component={PromotionEngine} />
          <Route path="/promptBuilder" component={PromptBuilder} />
          <Route path="/proofVault" component={ProofVault} />
          <Route path="/propertyComparison" component={PropertyComparison} />
          <Route path="/propertyDetail" component={PropertyDetail} />
          <Route path="/propertyListing" component={PropertyListing} />
          <Route path="/propertyTransfer" component={PropertyTransfer} />
          <Route path="/protocolLayer" component={ProtocolLayer} />
          <Route path="/publishingQueue" component={PublishingQueue} />
          <Route path="/publishingSchedule" component={PublishingSchedule} />
          <Route path="/pushNotifications" component={PushNotifications} />
          <Route path="/qRCodeGenerator" component={QRCodeGenerator} />
          <Route path="/quantumComputing" component={QuantumComputing} />
          <Route path="/quantumSafe" component={QuantumSafe} />
          <Route path="/quickActions" component={QuickActions} />
          <Route path="/quickStats" component={QuickStats} />
          <Route path="/quizBuilder" component={QuizBuilder} />
          <Route path="/rFMAnalysis" component={RFMAnalysis} />
          <Route path="/rFQSystem" component={RFQSystem} />
          <Route path="/radioButtonForm" component={RadioButtonForm} />
          <Route path="/rateLimitConfig" component={RateLimitConfig} />
          <Route path="/rateLimitDashboard" component={RateLimitDashboard} />
          <Route path="/rateLimitError" component={RateLimitError} />
          <Route path="/rateLimiting" component={RateLimiting} />
          <Route path="/ratingSystem" component={RatingSystem} />
          <Route path="/readReceipts" component={ReadReceipts} />
          <Route path="/realTimeGameEngine" component={RealTimeGameEngine} />
          <Route path="/realTimeMonitoring" component={RealTimeMonitoring} />
          <Route path="/realTimeStreaming" component={RealTimeStreaming} />
          <Route path="/rebalancingTools" component={RebalancingTools} />
          <Route path="/receiptDownload" component={ReceiptDownload} />
          <Route path="/receiveCrypto" component={ReceiveCrypto} />
          <Route path="/recentActivity" component={RecentActivity} />
          <Route path="/recommendations" component={Recommendations} />
          <Route path="/recommendationsFeed" component={RecommendationsFeed} />
          <Route path="/recommendedMatches" component={RecommendedMatches} />
          <Route path="/reels" component={Reels} />
          <Route path="/refactoringTools" component={RefactoringTools} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/refundRequests" component={RefundRequests} />
          <Route path="/regionalSettings" component={RegionalSettings} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/reportDialog" component={ReportDialog} />
          <Route path="/reportUser" component={ReportUser} />
          <Route path="/reportsDashboard" component={ReportsDashboard} />
          <Route path="/reputation" component={Reputation} />
          <Route path="/reputationSystem" component={ReputationSystem} />
          <Route path="/resourceAllocation" component={ResourceAllocation} />
          <Route path="/resourceLibrary" component={ResourceLibrary} />
          <Route path="/responseTime" component={ResponseTime} />
          <Route path="/retention" component={Retention} />
          <Route path="/retentionAnalytics" component={RetentionAnalytics} />
          <Route path="/retentionEngine" component={RetentionEngine} />
          <Route path="/retirementPlanner" component={RetirementPlanner} />
          <Route path="/returnManagement" component={ReturnManagement} />
          <Route path="/returnsRefunds" component={ReturnsRefunds} />
          <Route path="/revenueTracking" component={RevenueTracking} />
          <Route path="/reviewModeration" component={ReviewModeration} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/reviewsRatings" component={ReviewsRatings} />
          <Route path="/rewardSystem" component={RewardSystem} />
          <Route path="/rewardsMonitoring" component={RewardsMonitoring} />
          <Route path="/rewardsTracking" component={RewardsTracking} />
          <Route path="/riskAnalysis" component={RiskAnalysis} />
          <Route path="/riskManagement" component={RiskManagement} />
          <Route path="/roadmap" component={Roadmap} />
          <Route path="/roadmapView" component={RoadmapView} />
          <Route path="/roleBasedAccess" component={RoleBasedAccess} />
          <Route path="/roleManagement" component={RoleManagement} />
          <Route path="/sDKDownload" component={SDKDownload} />
          <Route path="/sDKManagement" component={SDKManagement} />
          <Route path="/sEOOptimizer" component={SEOOptimizer} />
          <Route path="/sKY444CentralBank" component={SKY444CentralBank} />
          <Route path="/sMSCampaigns" component={SMSCampaigns} />
          <Route path="/sMSIntegration" component={SMSIntegration} />
          <Route path="/sMSTemplates" component={SMSTemplates} />
          <Route path="/sMTPSettings" component={SMTPSettings} />
          <Route path="/sOC2" component={SOC2} />
          <Route path="/sSLCertificates" component={SSLCertificates} />
          <Route path="/sSO" component={SSO} />
          <Route path="/salesAnalytics" component={SalesAnalytics} />
          <Route path="/salesforceIntegration" component={SalesforceIntegration} />
          <Route path="/satisfactionSurvey" component={SatisfactionSurvey} />
          <Route path="/savedProperties" component={SavedProperties} />
          <Route path="/savedSearches" component={SavedSearches} />
          <Route path="/savingsGoals" component={SavingsGoals} />
          <Route path="/scheduledJobs" component={ScheduledJobs} />
          <Route path="/scheduledReports" component={ScheduledReports} />
          <Route path="/school" component={School} />
          <Route path="/schoolCertificate" component={SchoolCertificate} />
          <Route path="/schoolCourse" component={SchoolCourse} />
          <Route path="/schoolDashboard" component={SchoolDashboard} />
          <Route path="/schoolLesson" component={SchoolLesson} />
          <Route path="/schoolQuiz" component={SchoolQuiz} />
          <Route path="/search" component={Search} />
          <Route path="/searchAnalytics" component={SearchAnalytics} />
          <Route path="/searchHistory" component={SearchHistory} />
          <Route path="/searchResults" component={SearchResults} />
          <Route path="/searchSuggestions" component={SearchSuggestions} />
          <Route path="/seasonalEvents" component={SeasonalEvents} />
          <Route path="/security" component={Security} />
          <Route path="/securityAudit" component={SecurityAudit} />
          <Route path="/securityCompliance" component={SecurityCompliance} />
          <Route path="/securityDashboard" component={SecurityDashboard} />
          <Route path="/securitySettings" component={SecuritySettings} />
          <Route path="/segmentationAnalysis" component={SegmentationAnalysis} />
          <Route path="/selectDropdownForm" component={SelectDropdownForm} />
          <Route path="/selfHealingInfra" component={SelfHealingInfra} />
          <Route path="/sellerDashboard" component={SellerDashboard} />
          <Route path="/sellerProfile" component={SellerProfile} />
          <Route path="/sendCrypto" component={SendCrypto} />
          <Route path="/sentimentPipeline" component={SentimentPipeline} />
          <Route path="/serverHealth" component={ServerHealth} />
          <Route path="/serverInstaller" component={ServerInstaller} />
          <Route path="/serverStatus" component={ServerStatus} />
          <Route path="/settings" component={Settings} />
          <Route path="/settingsDialog" component={SettingsDialog} />
          <Route path="/setupWizard" component={SetupWizard} />
          <Route path="/shadowIdentity" component={ShadowIdentity} />
          <Route path="/shadowRelay" component={ShadowRelay} />
          <Route path="/shareDialog" component={ShareDialog} />
          <Route path="/shares" component={Shares} />
          <Route path="/sharing" component={Sharing} />
          <Route path="/shippingManagement" component={ShippingManagement} />
          <Route path="/shoppingCart" component={ShoppingCart} />
          <Route path="/sidebarNavigation" component={SidebarNavigation} />
          <Route path="/signUp" component={SignUp} />
          <Route path="/signUpFlow" component={SignUpFlow} />
          <Route path="/signUp_old" component={SignUp_old} />
          <Route path="/signin" component={Signin} />
          <Route path="/situationRoom" component={SituationRoom} />
          <Route path="/skillBadges" component={SkillBadges} />
          <Route path="/skySchool" component={SkySchool} />
          <Route path="/skySchoolAI" component={SkySchoolAI} />
          <Route path="/skySchoolQuiz" component={SkySchoolQuiz} />
          <Route path="/skyStore" component={SkyStore} />
          <Route path="/slackIntegration" component={SlackIntegration} />
          <Route path="/sleepTracking" component={SleepTracking} />
          <Route path="/slippageProtection" component={SlippageProtection} />
          <Route path="/smartContractAudit" component={SmartContractAudit} />
          <Route path="/smartContractViewer" component={SmartContractViewer} />
          <Route path="/smartContracts" component={SmartContracts} />
          <Route path="/socialAnalytics" component={SocialAnalytics} />
          <Route path="/socialEvents" component={SocialEvents} />
          <Route path="/socialFeed" component={SocialFeed} />
          <Route path="/socialFeedV2" component={SocialFeedV2} />
          <Route path="/socialGraph" component={SocialGraph} />
          <Route path="/socialMedia" component={SocialMedia} />
          <Route path="/socialMediaCampaigns" component={SocialMediaCampaigns} />
          <Route path="/solanaValidatorSetup" component={SolanaValidatorSetup} />
          <Route path="/sortOptions" component={SortOptions} />
          <Route path="/speechToText" component={SpeechToText} />
          <Route path="/spinWheel" component={SpinWheel} />
          <Route path="/sponsorships" component={Sponsorships} />
          <Route path="/stakeDelegation" component={StakeDelegation} />
          <Route path="/stakingDashboard" component={StakingDashboard} />
          <Route path="/stakingHub" component={StakingHub} />
          <Route path="/stakingOptions" component={StakingOptions} />
          <Route path="/stakingPortal" component={StakingPortal} />
          <Route path="/statisticsPanel" component={StatisticsPanel} />
          <Route path="/status" component={Status} />
          <Route path="/stepperWizard" component={StepperWizard} />
          <Route path="/stockChart" component={StockChart} />
          <Route path="/stockSearch" component={StockSearch} />
          <Route path="/stories" component={Stories} />
          <Route path="/streamAnalytics" component={StreamAnalytics} />
          <Route path="/streamClip" component={StreamClip} />
          <Route path="/streamGifting" component={StreamGifting} />
          <Route path="/streamingDashboard" component={StreamingDashboard} />
          <Route path="/stripeCheckout" component={StripeCheckout} />
          <Route path="/stripeIntegration" component={StripeIntegration} />
          <Route path="/studentProgress" component={StudentProgress} />
          <Route path="/styleSelector" component={StyleSelector} />
          <Route path="/subscriberManagement" component={SubscriberManagement} />
          <Route path="/subscriptionManagement" component={SubscriptionManagement} />
          <Route path="/subscriptionPlans" component={SubscriptionPlans} />
          <Route path="/subscriptionSetup" component={SubscriptionSetup} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route path="/successDialog" component={SuccessDialog} />
          <Route path="/successScreen" component={SuccessScreen} />
          <Route path="/supportMetrics" component={SupportMetrics} />
          <Route path="/supportTicket" component={SupportTicket} />
          <Route path="/swapInterface" component={SwapInterface} />
          <Route path="/swipeInterface" component={SwipeInterface} />
          <Route path="/synthetics" component={Synthetics} />
          <Route path="/systemArchitecture" component={SystemArchitecture} />
          <Route path="/systemLogs" component={SystemLogs} />
          <Route path="/systemMonitoring" component={SystemMonitoring} />
          <Route path="/systemObservability" component={SystemObservability} />
          <Route path="/systemSettings" component={SystemSettings} />
          <Route path="/systemStatus" component={SystemStatus} />
          <Route path="/tabsNavigation" component={TabsNavigation} />
          <Route path="/taskAutomation" component={TaskAutomation} />
          <Route path="/taskDetail" component={TaskDetail} />
          <Route path="/taskList" component={TaskList} />
          <Route path="/taxDocumentation" component={TaxDocumentation} />
          <Route path="/taxPlanning" component={TaxPlanning} />
          <Route path="/taxReporting" component={TaxReporting} />
          <Route path="/taxReports" component={TaxReports} />
          <Route path="/teachingOpportunities" component={TeachingOpportunities} />
          <Route path="/teamManagement" component={TeamManagement} />
          <Route path="/teamWorkspace" component={TeamWorkspace} />
          <Route path="/technicalIndicators" component={TechnicalIndicators} />
          <Route path="/telegramIntegration" component={TelegramIntegration} />
          <Route path="/templateLibrary" component={TemplateLibrary} />
          <Route path="/termsAcceptance" component={TermsAcceptance} />
          <Route path="/termsOfService" component={TermsOfService} />
          <Route path="/testingFramework" component={TestingFramework} />
          <Route path="/textInputForm" component={TextInputForm} />
          <Route path="/textToSpeech" component={TextToSpeech} />
          <Route path="/textTools" component={TextTools} />
          <Route path="/themeSettings" component={ThemeSettings} />
          <Route path="/threadManagement" component={ThreadManagement} />
          <Route path="/ticketAssignment" component={TicketAssignment} />
          <Route path="/ticketDetail" component={TicketDetail} />
          <Route path="/ticketQueue" component={TicketQueue} />
          <Route path="/tierComparison" component={TierComparison} />
          <Route path="/timeInputForm" component={TimeInputForm} />
          <Route path="/timePickerDialog" component={TimePickerDialog} />
          <Route path="/timeTracking" component={TimeTracking} />
          <Route path="/timelineView" component={TimelineView} />
          <Route path="/timeoutError" component={TimeoutError} />
          <Route path="/tipJar" component={TipJar} />
          <Route path="/toastNotifications" component={ToastNotifications} />
          <Route path="/todoList" component={TodoList} />
          <Route path="/toggleSwitchForm" component={ToggleSwitchForm} />
          <Route path="/tokenDashboard" component={TokenDashboard} />
          <Route path="/tokenGovernance" component={TokenGovernance} />
          <Route path="/tokenInformation" component={TokenInformation} />
          <Route path="/tokenMetrics" component={TokenMetrics} />
          <Route path="/tokenomicsCalculator" component={TokenomicsCalculator} />
          <Route path="/torBridge" component={TorBridge} />
          <Route path="/tournamentBracket" component={TournamentBracket} />
          <Route path="/tournamentBrackets" component={TournamentBrackets} />
          <Route path="/tournaments" component={Tournaments} />
          <Route path="/tradeHistory" component={TradeHistory} />
          <Route path="/trading" component={Trading} />
          <Route path="/tradingBots" component={TradingBots} />
          <Route path="/tradingHistory" component={TradingHistory} />
          <Route path="/tradingTerminal" component={TradingTerminal} />
          <Route path="/transactionExplorer" component={TransactionExplorer} />
          <Route path="/transactionHistory" component={TransactionHistory} />
          <Route path="/transactionViewer" component={TransactionViewer} />
          <Route path="/transcriptionManager" component={TranscriptionManager} />
          <Route path="/translationEnabledCommunity" component={TranslationEnabledCommunity} />
          <Route path="/translationEnabledSocialFeed" component={TranslationEnabledSocialFeed} />
          <Route path="/transparencyReports" component={TransparencyReports} />
          <Route path="/travelBlog" component={TravelBlog} />
          <Route path="/travelBudget" component={TravelBudget} />
          <Route path="/travelDocuments" component={TravelDocuments} />
          <Route path="/travelPhotos" component={TravelPhotos} />
          <Route path="/travelReviews" component={TravelReviews} />
          <Route path="/travelTips" component={TravelTips} />
          <Route path="/treasuryManagement" component={TreasuryManagement} />
          <Route path="/trendAnalysis" component={TrendAnalysis} />
          <Route path="/trending" component={Trending} />
          <Route path="/trendingContent" component={TrendingContent} />
          <Route path="/trendingItems" component={TrendingItems} />
          <Route path="/trendingTopics" component={TrendingTopics} />
          <Route path="/triggersActions" component={TriggersActions} />
          <Route path="/tripPlanner" component={TripPlanner} />
          <Route path="/trumpMining" component={TrumpMining} />
          <Route path="/trustSafetyDashboard" component={TrustSafetyDashboard} />
          <Route path="/trustSystem" component={TrustSystem} />
          <Route path="/twoFactorAuth" component={TwoFactorAuth} />
          <Route path="/twoFactorSetup" component={TwoFactorSetup} />
          <Route path="/typingIndicators" component={TypingIndicators} />
          <Route path="/unhiddenInterface" component={UnhiddenInterface} />
          <Route path="/unhiddenMode" component={UnhiddenMode} />
          <Route path="/unifiedFeed" component={UnifiedFeed} />
          <Route path="/unifiedIdentity" component={UnifiedIdentity} />
          <Route path="/unifiedMessaging" component={UnifiedMessaging} />
          <Route path="/unifiedPaymentLedger" component={UnifiedPaymentLedger} />
          <Route path="/unifiedPlatformDashboard" component={UnifiedPlatformDashboard} />
          <Route path="/unifiedWallet" component={UnifiedWallet} />
          <Route path="/universalSearch" component={UniversalSearch} />
          <Route path="/updatedLandingPage" component={UpdatedLandingPage} />
          <Route path="/upgradeDowngradePlan" component={UpgradeDowngradePlan} />
          <Route path="/upscaling" component={Upscaling} />
          <Route path="/userActivity" component={UserActivity} />
          <Route path="/userBehavior" component={UserBehavior} />
          <Route path="/userBio" component={UserBio} />
          <Route path="/userDirectory" component={UserDirectory} />
          <Route path="/userDiscovery" component={UserDiscovery} />
          <Route path="/userManagement" component={UserManagement} />
          <Route path="/userMentions" component={UserMentions} />
          <Route path="/userOnboarding" component={UserOnboarding} />
          <Route path="/userPermissions" component={UserPermissions} />
          <Route path="/userProfile" component={UserProfile} />
          <Route path="/userProfiles" component={UserProfiles} />
          <Route path="/userReputation" component={UserReputation} />
          <Route path="/userSearch" component={UserSearch} />
          <Route path="/userStats" component={UserStats} />
          <Route path="/userSuggestions" component={UserSuggestions} />
          <Route path="/userTimeline" component={UserTimeline} />
          <Route path="/vODArchive" component={VODArchive} />
          <Route path="/validatorPerformance" component={ValidatorPerformance} />
          <Route path="/validatorSetup" component={ValidatorSetup} />
          <Route path="/vendorAnalytics" component={VendorAnalytics} />
          <Route path="/vendorDirectory" component={VendorDirectory} />
          <Route path="/vendorOnboarding" component={VendorOnboarding} />
          <Route path="/vendorPerformance" component={VendorPerformance} />
          <Route path="/vendorVerification" component={VendorVerification} />
          <Route path="/venueManagement" component={VenueManagement} />
          <Route path="/verification" component={Verification} />
          <Route path="/verificationSteps" component={VerificationSteps} />
          <Route path="/verificationSystem" component={VerificationSystem} />
          <Route path="/versionManagement" component={VersionManagement} />
          <Route path="/vestingSchedule" component={VestingSchedule} />
          <Route path="/videoArea" component={VideoArea} />
          <Route path="/videoCall" component={VideoCall} />
          <Route path="/videoChat" component={VideoChat} />
          <Route path="/videoEditor" component={VideoEditor} />
          <Route path="/videoPlayer" component={VideoPlayer} />
          <Route path="/videoTools" component={VideoTools} />
          <Route path="/videoTutorials" component={VideoTutorials} />
          <Route path="/videoUpload" component={VideoUpload} />
          <Route path="/videoUploader" component={VideoUploader} />
          <Route path="/viewerMetrics" component={ViewerMetrics} />
          <Route path="/virtualTour" component={VirtualTour} />
          <Route path="/voiceCloning" component={VoiceCloning} />
          <Route path="/voiceCommands" component={VoiceCommands} />
          <Route path="/voiceCommandsRegistry" component={VoiceCommandsRegistry} />
          <Route path="/voiceMessages" component={VoiceMessages} />
          <Route path="/walkthroughPage" component={WalkthroughPage} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/walletConnect" component={WalletConnect} />
          <Route path="/walletIntegration" component={WalletIntegration} />
          <Route path="/walletOverview" component={WalletOverview} />
          <Route path="/warningDialog" component={WarningDialog} />
          <Route path="/watchEarn" component={WatchEarn} />
          <Route path="/watchList" component={WatchList} />
          <Route path="/wealthSimulator" component={WealthSimulator} />
          <Route path="/web3Auth" component={Web3Auth} />
          <Route path="/webhookManagement" component={WebhookManagement} />
          <Route path="/webhookManager" component={WebhookManager} />
          <Route path="/webhooks" component={Webhooks} />
          <Route path="/welcomeScreen" component={WelcomeScreen} />
          <Route path="/whaleMonitor" component={WhaleMonitor} />
          <Route path="/whitelistManagement" component={WhitelistManagement} />
          <Route path="/wishlist" component={WishlistManagement} />
          <Route path="/wishlistManagement" component={WishlistManagement} />
          <Route path="/workflowAutomation" component={WorkflowAutomation} />
          <Route path="/workflowBuilder" component={WorkflowBuilder} />
          <Route path="/worldBrain" component={WorldBrain} />
          <Route path="/worldSimulationControl" component={WorldSimulationControl} />
          <Route path="/yieldFarming" component={YieldFarming} />
          <Route path="/zapierIntegration" component={ZapierIntegration} />
          <Route path="/zeroKnowledgeProof" component={ZeroKnowledgeProof} />
          <Route path="/trading" component={TradingPage} />
          <Route path="/portfolio" component={PortfolioPage} />
          <Route path="/stocks" component={StocksPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/mining" component={MiningPage} />
          <Route path="/social-feed" component={SocialFeedPage} />
          <Route path="/profiles" component={ProfilesPage} />
          <Route path="/messaging" component={MessagingPage} />
          <Route path="/communities" component={CommunitiesPage} />
          <Route path="/games" component={GamesPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/tournaments" component={TournamentsPage} />
          <Route path="/rewards" component={RewardsPage} />
          <Route path="/marketplace" component={MarketplacePage} />
          <Route path="/marketplace-sell" component={MarketplaceSellPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/auctions" component={AuctionsPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/tutorials" component={TutorialsPage} />
          <Route path="/certifications" component={CertificationsPage} />
          <Route path="/resources" component={ResourcesPage} />
          <Route path="/creator-dashboard" component={CreatorDashboardPage} />
          <Route path="/creator-analytics" component={CreatorAnalyticsPage} />
          <Route path="/monetization" component={MonetizationPage} />
          <Route path="/creator-content" component={CreatorContentPage} />
          <Route path="/ai-brain" component={AIBrainPage} />
          <Route path="/ai-assistant" component={AIAssistantPage} />
          <Route path="/ai-tools" component={AIToolsPage} />
          <Route path="/ai-agents" component={AIAgentsPage} />
          <Route path="/dev-tools" component={DevToolsPage} />
          <Route path="/utilities" component={UtilitiesPage} />
          <Route path="/converters" component={ConvertersPage} />
          <Route path="/generators" component={GeneratorsPage} />
          <Route path="/admin-dashboard" component={AdminDashboardPage} />
          <Route path="/admin-users" component={AdminUsersPage} />
          <Route path="/admin-settings" component={AdminSettingsPage} />
          <Route path="/admin-reports" component={AdminReportsPage} />
          <Route path="/" component={Home} />
          <Route component={NotFound} />
                </Switch>
              </Suspense>
            </main>
            <BottomTabBar />
            <MobileBottomNav />
            <Footer />
          </div>
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  );
}
// Trigger rebuild after package.json and vite.config.ts fix
// Trigger new GitHub Pages build
