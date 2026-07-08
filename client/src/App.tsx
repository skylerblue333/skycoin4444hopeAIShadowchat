import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy load all 1057 pages
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
// Home is already imported at the top
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
// NotFound is already imported at the top
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

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/a-b-testing" component={ABTesting} />
        <Route path="/a-b-testing-advanced" component={ABTestingAdvanced} />
        <Route path="/a-i-agent-economy" component={AIAgentEconomy} />
        <Route path="/a-i-agent-market" component={AIAgentMarket} />
        <Route path="/a-i-assistant" component={AIAssistant} />
        <Route path="/a-i-brain" component={AIBrain} />
        <Route path="/a-i-code-studio" component={AICodeStudio} />
        <Route path="/a-i-copy-studio" component={AICopyStudio} />
        <Route path="/a-i-core" component={AICore} />
        <Route path="/a-i-engineer" component={AIEngineer} />
        <Route path="/a-i-governance" component={AIGovernance} />
        <Route path="/a-i-market-agents" component={AIMarketAgents} />
        <Route path="/a-i-matchmaker" component={AIMatchmaker} />
        <Route path="/a-i-moderation-queue" component={AIModerationQueue} />
        <Route path="/a-i-persona-feed" component={AIPersonaFeed} />
        <Route path="/a-i-persona-system" component={AIPersonaSystem} />
        <Route path="/a-i-tools-hub" component={AIToolsHub} />
        <Route path="/a-i-trading" component={AITrading} />
        <Route path="/a-i-training-loops" component={AITrainingLoops} />
        <Route path="/a-p-i-docs" component={APIDocs} />
        <Route path="/a-p-i-documentation" component={APIDocumentation} />
        <Route path="/a-p-i-integration" component={APIIntegration} />
        <Route path="/a-p-i-keys" component={APIKeys} />
        <Route path="/a-p-i-logs" component={APILogs} />
        <Route path="/a-p-i-management" component={APIManagement} />
        <Route path="/a-p-i-monitoring" component={APIMonitoring} />
        <Route path="/a-p-i-status" component={APIStatus} />
        <Route path="/a-p-i-testing" component={APITesting} />
        <Route path="/a-p-i-usage" component={APIUsage} />
        <Route path="/a-p-i-versioning" component={APIVersioning} />
        <Route path="/a-p-y-tracking" component={APYTracking} />
        <Route path="/about" component={About} />
        <Route path="/access-control" component={AccessControl} />
        <Route path="/accessibility-settings" component={AccessibilitySettings} />
        <Route path="/accordion-navigation" component={AccordionNavigation} />
        <Route path="/account-settings" component={AccountSettings} />
        <Route path="/achievement-badges" component={AchievementBadges} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/action-objects" component={ActionObjects} />
        <Route path="/action-panel" component={ActionPanel} />
        <Route path="/activity-feed" component={ActivityFeed} />
        <Route path="/activity-tracking" component={ActivityTracking} />
        <Route path="/adaptive-personalization" component={AdaptivePersonalization} />
        <Route path="/adaptive-roadmap" component={AdaptiveRoadmap} />
        <Route path="/add-bank-account" component={AddBankAccount} />
        <Route path="/add-credit-card" component={AddCreditCard} />
        <Route path="/address-book" component={AddressBook} />
        <Route path="/address-lookup" component={AddressLookup} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/admin-orders" component={AdminOrders} />
        <Route path="/admin-panel" component={AdminPanel} />
        <Route path="/admin-wallet-manager" component={AdminWalletManager} />
        <Route path="/advanced-admin-panel" component={AdvancedAdminPanel} />
        <Route path="/advanced-analytics" component={AdvancedAnalytics} />
        <Route path="/advanced-orders" component={AdvancedOrders} />
        <Route path="/advanced-search" component={AdvancedSearch} />
        <Route path="/affiliate-dashboard" component={AffiliateDashboard} />
        <Route path="/affiliate-program" component={AffiliateProgram} />
        <Route path="/age-gate" component={AgeGate} />
        <Route path="/age-verification" component={AgeVerification} />
        <Route path="/agent-builder" component={AgentBuilder} />
        <Route path="/agent-city" component={AgentCity} />
        <Route path="/agent-coordination" component={AgentCoordination} />
        <Route path="/agent-coordination-hub" component={AgentCoordinationHub} />
        <Route path="/agent-debate" component={AgentDebate} />
        <Route path="/agent-detail" component={AgentDetail} />
        <Route path="/agent-marketplace" component={AgentMarketplace} />
        <Route path="/agent-performance" component={AgentPerformance} />
        <Route path="/agent-sprint" component={AgentSprint} />
        <Route path="/agents-dashboard" component={AgentsDashboard} />
        <Route path="/alert-configuration" component={AlertConfiguration} />
        <Route path="/alert-dialog" component={AlertDialog} />
        <Route path="/alert-management" component={AlertManagement} />
        <Route path="/ambient-feed" component={AmbientFeed} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
        <Route path="/analytics-products" component={AnalyticsProducts} />
        <Route path="/analytics-reports" component={AnalyticsReports} />
        <Route path="/anomaly-detection" component={AnomalyDetection} />
        <Route path="/anti-surveillance" component={AntiSurveillance} />
        <Route path="/approval-workflows" component={ApprovalWorkflows} />
        <Route path="/arbitrage-bot" component={ArbitrageBot} />
        <Route path="/arcade" component={Arcade} />
        <Route path="/archive-management" component={ArchiveManagement} />
        <Route path="/asset-allocation" component={AssetAllocation} />
        <Route path="/asset-management" component={AssetManagement} />
        <Route path="/asset-tracking" component={AssetTracking} />
        <Route path="/assignment-tracker" component={AssignmentTracker} />
        <Route path="/attribution-modeling" component={AttributionModeling} />
        <Route path="/audience-segmentation" component={AudienceSegmentation} />
        <Route path="/audio-analytics" component={AudioAnalytics} />
        <Route path="/audio-editing" component={AudioEditing} />
        <Route path="/audio-library" component={AudioLibrary} />
        <Route path="/audio-player" component={AudioPlayer} />
        <Route path="/audit-log" component={AuditLog} />
        <Route path="/audit-logs" component={AuditLogs} />
        <Route path="/audit-trail" component={AuditTrail} />
        <Route path="/auto-responder" component={AutoResponder} />
        <Route path="/automation-engine" component={AutomationEngine} />
        <Route path="/automation-rules" component={AutomationRules} />
        <Route path="/automation-workflows" component={AutomationWorkflows} />
        <Route path="/backup-management" component={BackupManagement} />
        <Route path="/badges" component={Badges} />
        <Route path="/ban-suspend-user" component={BanSuspendUser} />
        <Route path="/batch-generation" component={BatchGeneration} />
        <Route path="/battle-pass" component={BattlePass} />
        <Route path="/behavioral-intelligence" component={BehavioralIntelligence} />
        <Route path="/beta" component={Beta} />
        <Route path="/billing-history" component={BillingHistory} />
        <Route path="/block-browser" component={BlockBrowser} />
        <Route path="/block-rewards" component={BlockRewards} />
        <Route path="/block-user" component={BlockUser} />
        <Route path="/blockchain-custody" component={BlockchainCustody} />
        <Route path="/blockchain-monitor" component={BlockchainMonitor} />
        <Route path="/blocked-users" component={BlockedUsers} />
        <Route path="/blog-editor" component={BlogEditor} />
        <Route path="/blog-publisher" component={BlogPublisher} />
        <Route path="/book-page" component={BookPage} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/bounty-system" component={BountySystem} />
        <Route path="/brand-guidelines" component={BrandGuidelines} />
        <Route path="/breadcrumb-navigation" component={BreadcrumbNavigation} />
        <Route path="/bridge-protocol" component={BridgeProtocol} />
        <Route path="/bridge-transactions" component={BridgeTransactions} />
        <Route path="/browser-extension" component={BrowserExtension} />
        <Route path="/budget-planner" component={BudgetPlanner} />
        <Route path="/bug-reporting" component={BugReporting} />
        <Route path="/build-order" component={BuildOrder} />
        <Route path="/build-roadmap" component={BuildRoadmap} />
        <Route path="/bulk-operations" component={BulkOperations} />
        <Route path="/bulk-ordering" component={BulkOrdering} />
        <Route path="/bulk-upload" component={BulkUpload} />
        <Route path="/c-c-p-a" component={CCPA} />
        <Route path="/c-d-n-management" component={CDNManagement} />
        <Route path="/c-r-m" component={CRM} />
        <Route path="/cache-management" component={CacheManagement} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/calendar-view" component={CalendarView} />
        <Route path="/campaign-analytics" component={CampaignAnalytics} />
        <Route path="/campaign-builder" component={CampaignBuilder} />
        <Route path="/campaign-creation" component={CampaignCreation} />
        <Route path="/car-rental" component={CarRental} />
        <Route path="/card-grid-view" component={CardGridView} />
        <Route path="/cash-flow-analysis" component={CashFlowAnalysis} />
        <Route path="/category-management" component={CategoryManagement} />
        <Route path="/certificate-manager" component={CertificateManager} />
        <Route path="/chain-explorer" component={ChainExplorer} />
        <Route path="/change-log" component={ChangeLog} />
        <Route path="/channel-customization" component={ChannelCustomization} />
        <Route path="/charity" component={Charity} />
        <Route path="/charity-leaderboard" component={CharityLeaderboard} />
        <Route path="/chart-analysis" component={ChartAnalysis} />
        <Route path="/chart-dashboard" component={ChartDashboard} />
        <Route path="/chat-bot" component={ChatBot} />
        <Route path="/chat-history" component={ChatHistory} />
        <Route path="/chat-m-v-p" component={ChatMVP} />
        <Route path="/checkbox-group-form" component={CheckboxGroupForm} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout-flow" component={CheckoutFlow} />
        <Route path="/china-edition" component={ChinaEdition} />
        <Route path="/churn-prediction" component={ChurnPrediction} />
        <Route path="/citizen-passport" component={CitizenPassport} />
        <Route path="/civilization-simulator" component={CivilizationSimulator} />
        <Route path="/clan-wars" component={ClanWars} />
        <Route path="/classroom-management" component={ClassroomManagement} />
        <Route path="/client-libraries" component={ClientLibraries} />
        <Route path="/closing-checklist" component={ClosingChecklist} />
        <Route path="/code-completion" component={CodeCompletion} />
        <Route path="/code-formatter" component={CodeFormatter} />
        <Route path="/code-highlighting" component={CodeHighlighting} />
        <Route path="/code-quality" component={CodeQuality} />
        <Route path="/code-quality-dashboard" component={CodeQualityDashboard} />
        <Route path="/code-repository" component={CodeRepository} />
        <Route path="/code-samples" component={CodeSamples} />
        <Route path="/cohort-analysis" component={CohortAnalysis} />
        <Route path="/color-picker-dialog" component={ColorPickerDialog} />
        <Route path="/comment-thread" component={CommentThread} />
        <Route path="/comments" component={Comments} />
        <Route path="/comments-section" component={CommentsSection} />
        <Route path="/commission-management" component={CommissionManagement} />
        <Route path="/community" component={Community} />
        <Route path="/community-create" component={CommunityCreate} />
        <Route path="/community-engagement" component={CommunityEngagement} />
        <Route path="/community-guidelines" component={CommunityGuidelines} />
        <Route path="/community-hub" component={CommunityHub} />
        <Route path="/company-simulator" component={CompanySimulator} />
        <Route path="/competitive-radar" component={CompetitiveRadar} />
        <Route path="/compliance-center" component={ComplianceCenter} />
        <Route path="/compliance-checker" component={ComplianceChecker} />
        <Route path="/compliance-checking" component={ComplianceChecking} />
        <Route path="/compliance-dashboard" component={ComplianceDashboard} />
        <Route path="/compliance-reports" component={ComplianceReports} />
        <Route path="/component-showcase" component={ComponentShowcase} />
        <Route path="/comprehensive-ecosystem-landing" component={ComprehensiveEcosystemLanding} />
        <Route path="/confirmation-dialog" component={ConfirmationDialog} />
        <Route path="/connected-apps" component={ConnectedApps} />
        <Route path="/connection-error" component={ConnectionError} />
        <Route path="/connection-requests" component={ConnectionRequests} />
        <Route path="/connector-intelligence" component={ConnectorIntelligence} />
        <Route path="/contact-management" component={ContactManagement} />
        <Route path="/contact-us-form" component={ContactUsForm} />
        <Route path="/content-analytics" component={ContentAnalytics} />
        <Route path="/content-calendar" component={ContentCalendar} />
        <Route path="/content-collaboration" component={ContentCollaboration} />
        <Route path="/content-flagging" component={ContentFlagging} />
        <Route path="/content-library" component={ContentLibrary} />
        <Route path="/content-moderation" component={ContentModeration} />
        <Route path="/content-scheduler" component={ContentScheduler} />
        <Route path="/content-scheduling" component={ContentScheduling} />
        <Route path="/content-upload" component={ContentUpload} />
        <Route path="/content-vault" component={ContentVault} />
        <Route path="/context-menu" component={ContextMenu} />
        <Route path="/contract-a-b-i" component={ContractABI} />
        <Route path="/contract-management" component={ContractManagement} />
        <Route path="/contribution-interface" component={ContributionInterface} />
        <Route path="/conversation-archive" component={ConversationArchive} />
        <Route path="/conversation-history" component={ConversationHistory} />
        <Route path="/conversion-funnel" component={ConversionFunnel} />
        <Route path="/conversion-optimization" component={ConversionOptimization} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/copyright-management" component={CopyrightManagement} />
        <Route path="/cost-allocation" component={CostAllocation} />
        <Route path="/cost-basis-calculation" component={CostBasisCalculation} />
        <Route path="/course-builder" component={CourseBuilder} />
        <Route path="/course-catalog" component={CourseCatalog} />
        <Route path="/cover-photo" component={CoverPhoto} />
        <Route path="/create-article" component={CreateArticle} />
        <Route path="/create-audio" component={CreateAudio} />
        <Route path="/create-drop" component={CreateDrop} />
        <Route path="/create-reel" component={CreateReel} />
        <Route path="/creator-analytics" component={CreatorAnalytics} />
        <Route path="/creator-dashboard" component={CreatorDashboard} />
        <Route path="/creator-economy" component={CreatorEconomy} />
        <Route path="/creator-funding" component={CreatorFunding} />
        <Route path="/creator-grants" component={CreatorGrants} />
        <Route path="/creator-intelligence" component={CreatorIntelligence} />
        <Route path="/creator-monetization" component={CreatorMonetization} />
        <Route path="/creator-network" component={CreatorNetwork} />
        <Route path="/creator-onboarding" component={CreatorOnboarding} />
        <Route path="/creator-profile" component={CreatorProfile} />
        <Route path="/creator-spotlight" component={CreatorSpotlight} />
        <Route path="/creator-studio" component={CreatorStudio} />
        <Route path="/cross-chain-interop" component={CrossChainInterop} />
        <Route path="/cross-chain-swap" component={CrossChainSwap} />
        <Route path="/crypto" component={Crypto} />
        <Route path="/crypto-enhancements-page" component={CryptoEnhancementsPage} />
        <Route path="/crypto-exchange" component={CryptoExchange} />
        <Route path="/crypto-hub" component={CryptoHub} />
        <Route path="/crypto-news" component={CryptoNews} />
        <Route path="/crypto-research-hub" component={CryptoResearchHub} />
        <Route path="/custom-dashboard" component={CustomDashboard} />
        <Route path="/custom-reports" component={CustomReports} />
        <Route path="/customer-analytics" component={CustomerAnalytics} />
        <Route path="/customer-disputes" component={CustomerDisputes} />
        <Route path="/d-a-o-governance" component={DAOGovernance} />
        <Route path="/d-a-o-treasury" component={DAOTreasury} />
        <Route path="/d-c-a-calculator" component={DCACalculator} />
        <Route path="/d-e-x-depth-chart" component={DEXDepthChart} />
        <Route path="/d-m-inbox" component={DMInbox} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard-overview" component={DashboardOverview} />
        <Route path="/data-export" component={DataExport} />
        <Route path="/data-grid" component={DataGrid} />
        <Route path="/data-lake" component={DataLake} />
        <Route path="/data-privacy" component={DataPrivacy} />
        <Route path="/data-processing" component={DataProcessing} />
        <Route path="/data-retention" component={DataRetention} />
        <Route path="/data-table" component={DataTable} />
        <Route path="/data-visualization" component={DataVisualization} />
        <Route path="/database-management" component={DatabaseManagement} />
        <Route path="/date-input-form" component={DateInputForm} />
        <Route path="/date-picker-dialog" component={DatePickerDialog} />
        <Route path="/dating-discovery" component={DatingDiscovery} />
        <Route path="/dating-home" component={DatingHome} />
        <Route path="/dating-matches" component={DatingMatches} />
        <Route path="/dating-messages" component={DatingMessages} />
        <Route path="/dating-premium" component={DatingPremium} />
        <Route path="/dating-profile" component={DatingProfile} />
        <Route path="/dating-profile-setup" component={DatingProfileSetup} />
        <Route path="/dating-subscription" component={DatingSubscription} />
        <Route path="/day-trade-room" component={DayTradeRoom} />
        <Route path="/de-fi" component={DeFi} />
        <Route path="/decentralized-identity" component={DecentralizedIdentity} />
        <Route path="/defensibility-moat" component={DefensibilityMoat} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/delete-content" component={DeleteContent} />
        <Route path="/department-management" component={DepartmentManagement} />
        <Route path="/dependency-graph" component={DependencyGraph} />
        <Route path="/deployment-pipeline" component={DeploymentPipeline} />
        <Route path="/deprecation-policy" component={DeprecationPolicy} />
        <Route path="/derivative-trading" component={DerivativeTrading} />
        <Route path="/derivatives-trading" component={DerivativesTrading} />
        <Route path="/destination-guide" component={DestinationGuide} />
        <Route path="/destiny-engine" component={DestinyEngine} />
        <Route path="/dev-ops" component={DevOps} />
        <Route path="/developer-area" component={DeveloperArea} />
        <Route path="/developer-community" component={DeveloperCommunity} />
        <Route path="/developer-marketplace" component={DeveloperMarketplace} />
        <Route path="/developer-protocol" component={DeveloperProtocol} />
        <Route path="/difficulty-calculator" component={DifficultyCalculator} />
        <Route path="/difficulty-tracking" component={DifficultyTracking} />
        <Route path="/digital-art-store" component={DigitalArtStore} />
        <Route path="/digital-nation-mode" component={DigitalNationMode} />
        <Route path="/digital-twin" component={DigitalTwin} />
        <Route path="/direct-messages" component={DirectMessages} />
        <Route path="/direct-messaging" component={DirectMessaging} />
        <Route path="/disaster-recovery" component={DisasterRecovery} />
        <Route path="/discord-integration" component={DiscordIntegration} />
        <Route path="/discover" component={Discover} />
        <Route path="/discussion-board" component={DiscussionBoard} />
        <Route path="/discussion-forums" component={DiscussionForums} />
        <Route path="/dispute-resolution" component={DisputeResolution} />
        <Route path="/distribution-channels" component={DistributionChannels} />
        <Route path="/document-editor" component={DocumentEditor} />
        <Route path="/document-management" component={DocumentManagement} />
        <Route path="/document-sharing" component={DocumentSharing} />
        <Route path="/document-signing" component={DocumentSigning} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/dogecoin-pool-selection" component={DogecoinPoolSelection} />
        <Route path="/domain-management" component={DomainManagement} />
        <Route path="/donation-processing" component={DonationProcessing} />
        <Route path="/dropdown-menu" component={DropdownMenu} />
        <Route path="/e-n-s-resolver" component={ENSResolver} />
        <Route path="/earnings-tracker" component={EarningsTracker} />
        <Route path="/earnings-tracking" component={EarningsTracking} />
        <Route path="/economic-layer" component={EconomicLayer} />
        <Route path="/economics" component={Economics} />
        <Route path="/economy-control" component={EconomyControl} />
        <Route path="/ecosystem" component={Ecosystem} />
        <Route path="/edit-profile" component={EditProfile} />
        <Route path="/email-campaigns" component={EmailCampaigns} />
        <Route path="/email-configuration" component={EmailConfiguration} />
        <Route path="/email-input-form" component={EmailInputForm} />
        <Route path="/email-integration" component={EmailIntegration} />
        <Route path="/email-notifications" component={EmailNotifications} />
        <Route path="/email-templates" component={EmailTemplates} />
        <Route path="/email-verification" component={EmailVerification} />
        <Route path="/embed-s-d-k" component={EmbedSDK} />
        <Route path="/empty-search-state" component={EmptySearchState} />
        <Route path="/engagement-metrics" component={EngagementMetrics} />
        <Route path="/engagement-stats" component={EngagementStats} />
        <Route path="/engineer" component={Engineer} />
        <Route path="/enterprise" component={Enterprise} />
        <Route path="/enterprise-a-p-i" component={EnterpriseAPI} />
        <Route path="/enterprise-analytics" component={EnterpriseAnalytics} />
        <Route path="/enterprise-billing" component={EnterpriseBilling} />
        <Route path="/entity-profile" component={EntityProfile} />
        <Route path="/environment-management" component={EnvironmentManagement} />
        <Route path="/error403" component={Error403} />
        <Route path="/error404" component={Error404} />
        <Route path="/error500" component={Error500} />
        <Route path="/error503" component={Error503} />
        <Route path="/error-dialog" component={ErrorDialog} />
        <Route path="/error-tracking" component={ErrorTracking} />
        <Route path="/escrow-shop" component={EscrowShop} />
        <Route path="/ethereum-pool-selector" component={EthereumPoolSelector} />
        <Route path="/event-analytics" component={EventAnalytics} />
        <Route path="/event-calendar" component={EventCalendar} />
        <Route path="/event-creation" component={EventCreation} />
        <Route path="/event-planner" component={EventPlanner} />
        <Route path="/event-registration" component={EventRegistration} />
        <Route path="/events" component={Events} />
        <Route path="/execution-history" component={ExecutionHistory} />
        <Route path="/exercise-library" component={ExerciseLibrary} />
        <Route path="/expense-management" component={ExpenseManagement} />
        <Route path="/expense-tracker" component={ExpenseTracker} />
        <Route path="/experiment-factory" component={ExperimentFactory} />
        <Route path="/experiment-tracker" component={ExperimentTracker} />
        <Route path="/explore" component={Explore} />
        <Route path="/export-data" component={ExportData} />
        <Route path="/f-a-q-management" component={FAQManagement} />
        <Route path="/f-a-q-page" component={FAQPage} />
        <Route path="/farming" component={Farming} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/feature-requests" component={FeatureRequests} />
        <Route path="/feature-tour" component={FeatureTour} />
        <Route path="/features" component={Features} />
        <Route path="/fee-calculation" component={FeeCalculation} />
        <Route path="/feed-with-posts" component={FeedWithPosts} />
        <Route path="/feedback" component={Feedback} />
        <Route path="/feedback-dialog" component={FeedbackDialog} />
        <Route path="/feedback-form" component={FeedbackForm} />
        <Route path="/feedback-hub" component={FeedbackHub} />
        <Route path="/file-browser" component={FileBrowser} />
        <Route path="/file-converter" component={FileConverter} />
        <Route path="/file-download" component={FileDownload} />
        <Route path="/file-preview" component={FilePreview} />
        <Route path="/file-sharing" component={FileSharing} />
        <Route path="/file-upload-dialog" component={FileUploadDialog} />
        <Route path="/file-upload-form" component={FileUploadForm} />
        <Route path="/file-upload-progress" component={FileUploadProgress} />
        <Route path="/file-versioning" component={FileVersioning} />
        <Route path="/filter-panel" component={FilterPanel} />
        <Route path="/financial-reports" component={FinancialReports} />
        <Route path="/flash-loans" component={FlashLoans} />
        <Route path="/flight-search" component={FlightSearch} />
        <Route path="/follow-list" component={FollowList} />
        <Route path="/follow-requests" component={FollowRequests} />
        <Route path="/follow-system" component={FollowSystem} />
        <Route path="/follow-unfollow" component={FollowUnfollow} />
        <Route path="/follower-list" component={FollowerList} />
        <Route path="/followers-network" component={FollowersNetwork} />
        <Route path="/forecasting-engine" component={ForecastingEngine} />
        <Route path="/forum-categories" component={ForumCategories} />
        <Route path="/framework-templates" component={FrameworkTemplates} />
        <Route path="/free-will-dashboard" component={FreeWillDashboard} />
        <Route path="/fundraiser-tools" component={FundraiserTools} />
        <Route path="/g-d-p-r" component={GDPR} />
        <Route path="/g-t-m-strategy" component={GTMStrategy} />
        <Route path="/gain-loss-tracking" component={GainLossTracking} />
        <Route path="/game-blackjack" component={GameBlackjack} />
        <Route path="/game-block-builder" component={GameBlockBuilder} />
        <Route path="/game-chat" component={GameChat} />
        <Route path="/game-crash" component={GameCrash} />
        <Route path="/game-crypto-quiz" component={GameCryptoQuiz} />
        <Route path="/game-fi-quest-board" component={GameFiQuestBoard} />
        <Route path="/game-lobby" component={GameLobby} />
        <Route path="/game-room" component={GameRoom} />
        <Route path="/game-settings" component={GameSettings} />
        <Route path="/game-slots" component={GameSlots} />
        <Route path="/game-token-tap" component={GameTokenTap} />
        <Route path="/gaming" component={Gaming} />
        <Route path="/gaming-for-charity" component={GamingForCharity} />
        <Route path="/gantt-chart" component={GanttChart} />
        <Route path="/gas-fee-estimator" component={GasFeeEstimator} />
        <Route path="/gas-price-monitor" component={GasPriceMonitor} />
        <Route path="/gas-tracker" component={GasTracker} />
        <Route path="/general-settings" component={GeneralSettings} />
        <Route path="/generated-api-explorer" component={GeneratedApiExplorer} />
        <Route path="/generated-gallery" component={GeneratedGallery} />
        <Route path="/getting-started-guide" component={GettingStartedGuide} />
        <Route path="/ghost-mode" component={GhostMode} />
        <Route path="/global-operations-center" component={GlobalOperationsCenter} />
        <Route path="/global-search" component={GlobalSearch} />
        <Route path="/governance" component={Governance} />
        <Route path="/governance-voting" component={GovernanceVoting} />
        <Route path="/governance-wizard" component={GovernanceWizard} />
        <Route path="/grade-book" component={GradeBook} />
        <Route path="/group-chat" component={GroupChat} />
        <Route path="/group-chats" component={GroupChats} />
        <Route path="/group-directory" component={GroupDirectory} />
        <Route path="/group-events" component={GroupEvents} />
        <Route path="/group-management" component={GroupManagement} />
        <Route path="/growth" component={Growth} />
        <Route path="/guilds" component={Guilds} />
        <Route path="/h-i-p-a-a" component={HIPAA} />
        <Route path="/h-o-p-e-a-i-control" component={HOPEAIControl} />
        <Route path="/hash-rate-monitor" component={HashRateMonitor} />
        <Route path="/hashtag-explorer" component={HashtagExplorer} />
        <Route path="/hashtag-search" component={HashtagSearch} />
        <Route path="/hashtags" component={Hashtags} />
        <Route path="/health-articles" component={HealthArticles} />
        <Route path="/health-dashboard" component={HealthDashboard} />
        <Route path="/health-goals" component={HealthGoals} />
        <Route path="/help-center" component={HelpCenter} />
        <Route path="/home" component={Home} />
        <Route path="/hope-a-i" component={HopeAI} />
        <Route path="/hope-a-i-advanced" component={HopeAIAdvanced} />
        <Route path="/hope-a-i-meta" component={HopeAIMeta} />
        <Route path="/hope-a-i-page" component={HopeAIPage} />
        <Route path="/hope-a-i-upgrades" component={HopeAIUpgrades} />
        <Route path="/hotel-search" component={HotelSearch} />
        <Route path="/hub-spot-integration" component={HubSpotIntegration} />
        <Route path="/i-c-o-launchpad" component={ICOLaunchpad} />
        <Route path="/i-f-t-t-t" component={IFTTT} />
        <Route path="/i-i-t-r" component={IITR} />
        <Route path="/i-t-services-landing" component={ITServicesLanding} />
        <Route path="/i-t-services-portal" component={ITServicesPortal} />
        <Route path="/image-editor" component={ImageEditor} />
        <Route path="/image-gallery" component={ImageGallery} />
        <Route path="/image-tools" component={ImageTools} />
        <Route path="/image-viewer" component={ImageViewer} />
        <Route path="/impact-map" component={ImpactMap} />
        <Route path="/impact-metrics" component={ImpactMetrics} />
        <Route path="/in-app-notifications" component={InAppNotifications} />
        <Route path="/in-game-currency" component={InGameCurrency} />
        <Route path="/incident-management" component={IncidentManagement} />
        <Route path="/input-dialog" component={InputDialog} />
        <Route path="/instructor-dashboard" component={InstructorDashboard} />
        <Route path="/integration-setup" component={IntegrationSetup} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/inventory-management" component={InventoryManagement} />
        <Route path="/investment-goals" component={InvestmentGoals} />
        <Route path="/investor-metrics" component={InvestorMetrics} />
        <Route path="/investor-pitch" component={InvestorPitch} />
        <Route path="/investor-portal" component={InvestorPortal} />
        <Route path="/investor-room" component={InvestorRoom} />
        <Route path="/invoice-details" component={InvoiceDetails} />
        <Route path="/invoice-management" component={InvoiceManagement} />
        <Route path="/k-y-c-verification" component={KYCVerification} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/l-d-a-p-integration" component={LDAPIntegration} />
        <Route path="/l-t-v-analysis" component={LTVAnalysis} />
        <Route path="/landing-page" component={LandingPage} />
        <Route path="/language-exchange-admin" component={LanguageExchangeAdmin} />
        <Route path="/language-partner-discovery" component={LanguagePartnerDiscovery} />
        <Route path="/language-selector" component={LanguageSelector} />
        <Route path="/language-settings" component={LanguageSettings} />
        <Route path="/lead-scoring" component={LeadScoring} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/leaderboards" component={Leaderboards} />
        <Route path="/learning" component={Learning} />
        <Route path="/learning-path" component={LearningPath} />
        <Route path="/legal-documents" component={LegalDocuments} />
        <Route path="/legendary-status" component={LegendaryStatus} />
        <Route path="/lending-borrow" component={LendingBorrow} />
        <Route path="/lending-borrowing" component={LendingBorrowing} />
        <Route path="/lesson-editor" component={LessonEditor} />
        <Route path="/life-command" component={LifeCommand} />
        <Route path="/lightbox" component={Lightbox} />
        <Route path="/like-reaction-system" component={LikeReactionSystem} />
        <Route path="/likes" component={Likes} />
        <Route path="/liquid-staking" component={LiquidStaking} />
        <Route path="/liquidity-pools" component={LiquidityPools} />
        <Route path="/list-view" component={ListView} />
        <Route path="/live" component={Live} />
        <Route path="/live-chat" component={LiveChat} />
        <Route path="/live-gifting" component={LiveGifting} />
        <Route path="/live-reactions" component={LiveReactions} />
        <Route path="/live-stream-setup" component={LiveStreamSetup} />
        <Route path="/live-streaming" component={LiveStreaming} />
        <Route path="/livestream-dashboard" component={LivestreamDashboard} />
        <Route path="/load-balancing" component={LoadBalancing} />
        <Route path="/loading-dialog" component={LoadingDialog} />
        <Route path="/log-viewer" component={LogViewer} />
        <Route path="/login" component={Login} />
        <Route path="/logistics-optimizer" component={LogisticsOptimizer} />
        <Route path="/m-l-insights" component={MLInsights} />
        <Route path="/m-l-models" component={MLModels} />
        <Route path="/mailing-lists" component={MailingLists} />
        <Route path="/main-dashboard" component={MainDashboard} />
        <Route path="/maintenance-mode" component={MaintenanceMode} />
        <Route path="/map-view" component={MapView} />
        <Route path="/margin-trading" component={MarginTrading} />
        <Route path="/markdown-rendering" component={MarkdownRendering} />
        <Route path="/market-sentiment" component={MarketSentiment} />
        <Route path="/marketing-r-o-i" component={MarketingROI} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/marketplace-analytics" component={MarketplaceAnalytics} />
        <Route path="/master-architecture" component={MasterArchitecture} />
        <Route path="/match-chat" component={MatchChat} />
        <Route path="/match-feed" component={MatchFeed} />
        <Route path="/match-space" component={MatchSpace} />
        <Route path="/matching-algorithm" component={MatchingAlgorithm} />
        <Route path="/matchmaking" component={Matchmaking} />
        <Route path="/meal-plans" component={MealPlans} />
        <Route path="/media-carousel" component={MediaCarousel} />
        <Route path="/media-gallery" component={MediaGallery} />
        <Route path="/medication-reminder" component={MedicationReminder} />
        <Route path="/mega-marketplace" component={MegaMarketplace} />
        <Route path="/membership-tiers" component={MembershipTiers} />
        <Route path="/memory-constellation" component={MemoryConstellation} />
        <Route path="/memory-graph-visualizer" component={MemoryGraphVisualizer} />
        <Route path="/memory-system" component={MemorySystem} />
        <Route path="/mentions" component={Mentions} />
        <Route path="/message-encryption" component={MessageEncryption} />
        <Route path="/message-search" component={MessageSearch} />
        <Route path="/messages" component={Messages} />
        <Route path="/metaverse-portal" component={MetaversePortal} />
        <Route path="/milestone-tracking" component={MilestoneTracking} />
        <Route path="/miner-dashboard" component={MinerDashboard} />
        <Route path="/mining-calculator" component={MiningCalculator} />
        <Route path="/mining-dashboard" component={MiningDashboard} />
        <Route path="/mining-pool-selector" component={MiningPoolSelector} />
        <Route path="/mission-control" component={MissionControl} />
        <Route path="/mobile" component={Mobile} />
        <Route path="/mobile-app" component={MobileApp} />
        <Route path="/mobile-gaming" component={MobileGaming} />
        <Route path="/mobile-home" component={MobileHome} />
        <Route path="/mobile-menu" component={MobileMenu} />
        <Route path="/mobile-messages" component={MobileMessages} />
        <Route path="/mobile-notifications" component={MobileNotifications} />
        <Route path="/mobile-profile" component={MobileProfile} />
        <Route path="/mobile-search" component={MobileSearch} />
        <Route path="/mobile-settings" component={MobileSettings} />
        <Route path="/mobile-shop" component={MobileShop} />
        <Route path="/mobile-streaming" component={MobileStreaming} />
        <Route path="/mobile-trading" component={MobileTrading} />
        <Route path="/mobile-wallet" component={MobileWallet} />
        <Route path="/moderation-dashboard" component={ModerationDashboard} />
        <Route path="/monetization" component={Monetization} />
        <Route path="/mood-tracker" component={MoodTracker} />
        <Route path="/mortgage-calculator" component={MortgageCalculator} />
        <Route path="/movie-catalog" component={MovieCatalog} />
        <Route path="/movie-detail" component={MovieDetail} />
        <Route path="/multi-model-selector" component={MultiModelSelector} />
        <Route path="/multi-select-form" component={MultiSelectForm} />
        <Route path="/multiplayer-lobby" component={MultiplayerLobby} />
        <Route path="/multivariate-testing" component={MultivariateTesting} />
        <Route path="/music-generation" component={MusicGeneration} />
        <Route path="/mutual-connections" component={MutualConnections} />
        <Route path="/mutual-friends" component={MutualFriends} />
        <Route path="/my-learning" component={MyLearning} />
        <Route path="/my-trips" component={MyTrips} />
        <Route path="/n-f-t-gallery" component={NFTGallery} />
        <Route path="/n-f-t-minting" component={NFTMinting} />
        <Route path="/n-f-t-wallet" component={NFTWallet} />
        <Route path="/n-l-p-tools" component={NLPTools} />
        <Route path="/n-s-f-w-feed" component={NSFWFeed} />
        <Route path="/n-s-f-w-platform" component={NSFWPlatform} />
        <Route path="/narrative-engine" component={NarrativeEngine} />
        <Route path="/net-worth-tracker" component={NetWorthTracker} />
        <Route path="/network-graph" component={NetworkGraph} />
        <Route path="/network-health" component={NetworkHealth} />
        <Route path="/network-statistics" component={NetworkStatistics} />
        <Route path="/not-found" component={NotFound} />
        <Route path="/notes-app" component={NotesApp} />
        <Route path="/notification-center" component={NotificationCenter} />
        <Route path="/notification-history" component={NotificationHistory} />
        <Route path="/notification-intelligence" component={NotificationIntelligence} />
        <Route path="/notification-preferences" component={NotificationPreferences} />
        <Route path="/notification-settings" component={NotificationSettings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/notifications-center" component={NotificationsCenter} />
        <Route path="/notifications-hub" component={NotificationsHub} />
        <Route path="/number-input-form" component={NumberInputForm} />
        <Route path="/nutrition-tracker" component={NutritionTracker} />
        <Route path="/o-auth-providers" component={OAuthProviders} />
        <Route path="/offer-management" component={OfferManagement} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/onboarding-tutorial" component={OnboardingTutorial} />
        <Route path="/options-trading" component={OptionsTrading} />
        <Route path="/oracle-network" component={OracleNetwork} />
        <Route path="/order-book" component={OrderBook} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/order-history" component={OrderHistory} />
        <Route path="/order-placement" component={OrderPlacement} />
        <Route path="/order-tracking" component={OrderTracking} />
        <Route path="/order-types" component={OrderTypes} />
        <Route path="/organization-settings" component={OrganizationSettings} />
        <Route path="/p2-e-shop" component={P2EShop} />
        <Route path="/pagination" component={Pagination} />
        <Route path="/password-input-form" component={PasswordInputForm} />
        <Route path="/password-reset" component={PasswordReset} />
        <Route path="/pay-pal-integration" component={PayPalIntegration} />
        <Route path="/payment-confirmation" component={PaymentConfirmation} />
        <Route path="/payment-infra" component={PaymentInfra} />
        <Route path="/payment-methods" component={PaymentMethods} />
        <Route path="/payment-setup" component={PaymentSetup} />
        <Route path="/payments" component={Payments} />
        <Route path="/payout-dashboard" component={PayoutDashboard} />
        <Route path="/payout-management" component={PayoutManagement} />
        <Route path="/performance-metrics" component={PerformanceMetrics} />
        <Route path="/performance-tuning" component={PerformanceTuning} />
        <Route path="/permission-management" component={PermissionManagement} />
        <Route path="/perpetual-futures" component={PerpetualFutures} />
        <Route path="/persona-builder" component={PersonaBuilder} />
        <Route path="/phase1-dashboard" component={Phase1Dashboard} />
        <Route path="/phase2to4-dashboard" component={Phase2to4Dashboard} />
        <Route path="/phone-verification" component={PhoneVerification} />
        <Route path="/platform-map" component={PlatformMap} />
        <Route path="/platform-status" component={PlatformStatus} />
        <Route path="/playlist-management" component={PlaylistManagement} />
        <Route path="/playlist-manager" component={PlaylistManager} />
        <Route path="/podcast-studio" component={PodcastStudio} />
        <Route path="/policy-management" component={PolicyManagement} />
        <Route path="/pool-performance" component={PoolPerformance} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/portfolio-comparison" component={PortfolioComparison} />
        <Route path="/portfolio-optimization" component={PortfolioOptimization} />
        <Route path="/portfolio-overview" component={PortfolioOverview} />
        <Route path="/portfolio-rebalance" component={PortfolioRebalance} />
        <Route path="/portfolio-tracker" component={PortfolioTracker} />
        <Route path="/portfolio-tracking" component={PortfolioTracking} />
        <Route path="/position-management" component={PositionManagement} />
        <Route path="/power-user-tools" component={PowerUserTools} />
        <Route path="/practice-sessions" component={PracticeSessions} />
        <Route path="/predictive-analytics" component={PredictiveAnalytics} />
        <Route path="/predictive-models" component={PredictiveModels} />
        <Route path="/predictive-systems" component={PredictiveSystems} />
        <Route path="/preferences-setup" component={PreferencesSetup} />
        <Route path="/premium-features" component={PremiumFeatures} />
        <Route path="/presentation-with-chat" component={PresentationWithChat} />
        <Route path="/price-alerts" component={PriceAlerts} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/pricing-engine" component={PricingEngine} />
        <Route path="/pricing-management" component={PricingManagement} />
        <Route path="/pricing-rules" component={PricingRules} />
        <Route path="/priority-matrix" component={PriorityMatrix} />
        <Route path="/privacy-mixer" component={PrivacyMixer} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/privacy-settings" component={PrivacySettings} />
        <Route path="/privacy-vault" component={PrivacyVault} />
        <Route path="/product-approval" component={ProductApproval} />
        <Route path="/product-brain" component={ProductBrain} />
        <Route path="/product-catalog" component={ProductCatalog} />
        <Route path="/product-comparison" component={ProductComparison} />
        <Route path="/product-detail" component={ProductDetail} />
        <Route path="/product-listing" component={ProductListing} />
        <Route path="/product-listings" component={ProductListings} />
        <Route path="/product-reviews" component={ProductReviews} />
        <Route path="/production-architecture" component={ProductionArchitecture} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile-completion" component={ProfileCompletion} />
        <Route path="/profile-creation" component={ProfileCreation} />
        <Route path="/profile-customization" component={ProfileCustomization} />
        <Route path="/profile-dashboard" component={ProfileDashboard} />
        <Route path="/profile-edit" component={ProfileEdit} />
        <Route path="/profile-picture" component={ProfilePicture} />
        <Route path="/profile-preview" component={ProfilePreview} />
        <Route path="/profile-view" component={ProfileView} />
        <Route path="/profile-wallet" component={ProfileWallet} />
        <Route path="/profitability" component={Profitability} />
        <Route path="/progress-bar" component={ProgressBar} />
        <Route path="/progress-tracking" component={ProgressTracking} />
        <Route path="/project-board" component={ProjectBoard} />
        <Route path="/project-listing" component={ProjectListing} />
        <Route path="/promotion-engine" component={PromotionEngine} />
        <Route path="/prompt-builder" component={PromptBuilder} />
        <Route path="/proof-vault" component={ProofVault} />
        <Route path="/property-comparison" component={PropertyComparison} />
        <Route path="/property-detail" component={PropertyDetail} />
        <Route path="/property-listing" component={PropertyListing} />
        <Route path="/property-transfer" component={PropertyTransfer} />
        <Route path="/protocol-layer" component={ProtocolLayer} />
        <Route path="/publishing-queue" component={PublishingQueue} />
        <Route path="/publishing-schedule" component={PublishingSchedule} />
        <Route path="/push-notifications" component={PushNotifications} />
        <Route path="/q-r-code-generator" component={QRCodeGenerator} />
        <Route path="/quantum-computing" component={QuantumComputing} />
        <Route path="/quantum-safe" component={QuantumSafe} />
        <Route path="/quick-actions" component={QuickActions} />
        <Route path="/quick-stats" component={QuickStats} />
        <Route path="/quiz-builder" component={QuizBuilder} />
        <Route path="/r-f-m-analysis" component={RFMAnalysis} />
        <Route path="/r-f-q-system" component={RFQSystem} />
        <Route path="/radio-button-form" component={RadioButtonForm} />
        <Route path="/rate-limit-config" component={RateLimitConfig} />
        <Route path="/rate-limit-dashboard" component={RateLimitDashboard} />
        <Route path="/rate-limit-error" component={RateLimitError} />
        <Route path="/rate-limiting" component={RateLimiting} />
        <Route path="/rating-system" component={RatingSystem} />
        <Route path="/read-receipts" component={ReadReceipts} />
        <Route path="/real-time-game-engine" component={RealTimeGameEngine} />
        <Route path="/real-time-monitoring" component={RealTimeMonitoring} />
        <Route path="/real-time-streaming" component={RealTimeStreaming} />
        <Route path="/rebalancing-tools" component={RebalancingTools} />
        <Route path="/receipt-download" component={ReceiptDownload} />
        <Route path="/receive-crypto" component={ReceiveCrypto} />
        <Route path="/recent-activity" component={RecentActivity} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/recommendations-feed" component={RecommendationsFeed} />
        <Route path="/recommended-matches" component={RecommendedMatches} />
        <Route path="/reels" component={Reels} />
        <Route path="/refactoring-tools" component={RefactoringTools} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/refund-requests" component={RefundRequests} />
        <Route path="/regional-settings" component={RegionalSettings} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/report-dialog" component={ReportDialog} />
        <Route path="/report-user" component={ReportUser} />
        <Route path="/reports-dashboard" component={ReportsDashboard} />
        <Route path="/reputation" component={Reputation} />
        <Route path="/reputation-system" component={ReputationSystem} />
        <Route path="/resource-allocation" component={ResourceAllocation} />
        <Route path="/resource-library" component={ResourceLibrary} />
        <Route path="/response-time" component={ResponseTime} />
        <Route path="/retention" component={Retention} />
        <Route path="/retention-analytics" component={RetentionAnalytics} />
        <Route path="/retention-engine" component={RetentionEngine} />
        <Route path="/retirement-planner" component={RetirementPlanner} />
        <Route path="/return-management" component={ReturnManagement} />
        <Route path="/returns-refunds" component={ReturnsRefunds} />
        <Route path="/revenue-tracking" component={RevenueTracking} />
        <Route path="/review-moderation" component={ReviewModeration} />
        <Route path="/reviews" component={Reviews} />
        <Route path="/reviews-ratings" component={ReviewsRatings} />
        <Route path="/reward-system" component={RewardSystem} />
        <Route path="/rewards-monitoring" component={RewardsMonitoring} />
        <Route path="/rewards-tracking" component={RewardsTracking} />
        <Route path="/risk-analysis" component={RiskAnalysis} />
        <Route path="/risk-management" component={RiskManagement} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/roadmap-view" component={RoadmapView} />
        <Route path="/role-based-access" component={RoleBasedAccess} />
        <Route path="/role-management" component={RoleManagement} />
        <Route path="/s-d-k-download" component={SDKDownload} />
        <Route path="/s-d-k-management" component={SDKManagement} />
        <Route path="/s-e-o-optimizer" component={SEOOptimizer} />
        <Route path="/s-k-y444-central-bank" component={SKY444CentralBank} />
        <Route path="/s-m-s-campaigns" component={SMSCampaigns} />
        <Route path="/s-m-s-integration" component={SMSIntegration} />
        <Route path="/s-m-s-templates" component={SMSTemplates} />
        <Route path="/s-m-t-p-settings" component={SMTPSettings} />
        <Route path="/s-o-c2" component={SOC2} />
        <Route path="/s-s-l-certificates" component={SSLCertificates} />
        <Route path="/s-s-o" component={SSO} />
        <Route path="/sales-analytics" component={SalesAnalytics} />
        <Route path="/salesforce-integration" component={SalesforceIntegration} />
        <Route path="/satisfaction-survey" component={SatisfactionSurvey} />
        <Route path="/saved-properties" component={SavedProperties} />
        <Route path="/saved-searches" component={SavedSearches} />
        <Route path="/savings-goals" component={SavingsGoals} />
        <Route path="/scheduled-jobs" component={ScheduledJobs} />
        <Route path="/scheduled-reports" component={ScheduledReports} />
        <Route path="/school" component={School} />
        <Route path="/school-certificate" component={SchoolCertificate} />
        <Route path="/school-course" component={SchoolCourse} />
        <Route path="/school-dashboard" component={SchoolDashboard} />
        <Route path="/school-lesson" component={SchoolLesson} />
        <Route path="/school-quiz" component={SchoolQuiz} />
        <Route path="/search" component={Search} />
        <Route path="/search-analytics" component={SearchAnalytics} />
        <Route path="/search-history" component={SearchHistory} />
        <Route path="/search-results" component={SearchResults} />
        <Route path="/search-suggestions" component={SearchSuggestions} />
        <Route path="/seasonal-events" component={SeasonalEvents} />
        <Route path="/security" component={Security} />
        <Route path="/security-audit" component={SecurityAudit} />
        <Route path="/security-compliance" component={SecurityCompliance} />
        <Route path="/security-dashboard" component={SecurityDashboard} />
        <Route path="/security-settings" component={SecuritySettings} />
        <Route path="/segmentation-analysis" component={SegmentationAnalysis} />
        <Route path="/select-dropdown-form" component={SelectDropdownForm} />
        <Route path="/self-healing-infra" component={SelfHealingInfra} />
        <Route path="/seller-dashboard" component={SellerDashboard} />
        <Route path="/seller-profile" component={SellerProfile} />
        <Route path="/send-crypto" component={SendCrypto} />
        <Route path="/sentiment-pipeline" component={SentimentPipeline} />
        <Route path="/server-health" component={ServerHealth} />
        <Route path="/server-installer" component={ServerInstaller} />
        <Route path="/server-status" component={ServerStatus} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings-dialog" component={SettingsDialog} />
        <Route path="/setup-wizard" component={SetupWizard} />
        <Route path="/shadow-identity" component={ShadowIdentity} />
        <Route path="/shadow-relay" component={ShadowRelay} />
        <Route path="/share-dialog" component={ShareDialog} />
        <Route path="/shares" component={Shares} />
        <Route path="/sharing" component={Sharing} />
        <Route path="/shipping-management" component={ShippingManagement} />
        <Route path="/shopping-cart" component={ShoppingCart} />
        <Route path="/sidebar-navigation" component={SidebarNavigation} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/sign-up-flow" component={SignUpFlow} />
        <Route path="/sign-up_old" component={SignUp_old} />
        <Route path="/signin" component={Signin} />
        <Route path="/situation-room" component={SituationRoom} />
        <Route path="/skill-badges" component={SkillBadges} />
        <Route path="/sky-school" component={SkySchool} />
        <Route path="/sky-school-a-i" component={SkySchoolAI} />
        <Route path="/sky-school-quiz" component={SkySchoolQuiz} />
        <Route path="/sky-store" component={SkyStore} />
        <Route path="/slack-integration" component={SlackIntegration} />
        <Route path="/sleep-tracking" component={SleepTracking} />
        <Route path="/slippage-protection" component={SlippageProtection} />
        <Route path="/smart-contract-audit" component={SmartContractAudit} />
        <Route path="/smart-contract-viewer" component={SmartContractViewer} />
        <Route path="/smart-contracts" component={SmartContracts} />
        <Route path="/social-analytics" component={SocialAnalytics} />
        <Route path="/social-events" component={SocialEvents} />
        <Route path="/social-feed" component={SocialFeed} />
        <Route path="/social-feed-v2" component={SocialFeedV2} />
        <Route path="/social-graph" component={SocialGraph} />
        <Route path="/social-media" component={SocialMedia} />
        <Route path="/social-media-campaigns" component={SocialMediaCampaigns} />
        <Route path="/solana-validator-setup" component={SolanaValidatorSetup} />
        <Route path="/sort-options" component={SortOptions} />
        <Route path="/speech-to-text" component={SpeechToText} />
        <Route path="/spin-wheel" component={SpinWheel} />
        <Route path="/sponsorships" component={Sponsorships} />
        <Route path="/stake-delegation" component={StakeDelegation} />
        <Route path="/staking-dashboard" component={StakingDashboard} />
        <Route path="/staking-hub" component={StakingHub} />
        <Route path="/staking-options" component={StakingOptions} />
        <Route path="/staking-portal" component={StakingPortal} />
        <Route path="/statistics-panel" component={StatisticsPanel} />
        <Route path="/status" component={Status} />
        <Route path="/stepper-wizard" component={StepperWizard} />
        <Route path="/stock-chart" component={StockChart} />
        <Route path="/stock-search" component={StockSearch} />
        <Route path="/stories" component={Stories} />
        <Route path="/stream-analytics" component={StreamAnalytics} />
        <Route path="/stream-clip" component={StreamClip} />
        <Route path="/stream-gifting" component={StreamGifting} />
        <Route path="/streaming-dashboard" component={StreamingDashboard} />
        <Route path="/stripe-checkout" component={StripeCheckout} />
        <Route path="/stripe-integration" component={StripeIntegration} />
        <Route path="/student-progress" component={StudentProgress} />
        <Route path="/style-selector" component={StyleSelector} />
        <Route path="/subscriber-management" component={SubscriberManagement} />
        <Route path="/subscription-management" component={SubscriptionManagement} />
        <Route path="/subscription-plans" component={SubscriptionPlans} />
        <Route path="/subscription-setup" component={SubscriptionSetup} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/success-dialog" component={SuccessDialog} />
        <Route path="/success-screen" component={SuccessScreen} />
        <Route path="/support-metrics" component={SupportMetrics} />
        <Route path="/support-ticket" component={SupportTicket} />
        <Route path="/swap-interface" component={SwapInterface} />
        <Route path="/swipe-interface" component={SwipeInterface} />
        <Route path="/synthetics" component={Synthetics} />
        <Route path="/system-architecture" component={SystemArchitecture} />
        <Route path="/system-logs" component={SystemLogs} />
        <Route path="/system-monitoring" component={SystemMonitoring} />
        <Route path="/system-observability" component={SystemObservability} />
        <Route path="/system-settings" component={SystemSettings} />
        <Route path="/system-status" component={SystemStatus} />
        <Route path="/tabs-navigation" component={TabsNavigation} />
        <Route path="/task-automation" component={TaskAutomation} />
        <Route path="/task-detail" component={TaskDetail} />
        <Route path="/task-list" component={TaskList} />
        <Route path="/tax-documentation" component={TaxDocumentation} />
        <Route path="/tax-planning" component={TaxPlanning} />
        <Route path="/tax-reporting" component={TaxReporting} />
        <Route path="/tax-reports" component={TaxReports} />
        <Route path="/teaching-opportunities" component={TeachingOpportunities} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/team-workspace" component={TeamWorkspace} />
        <Route path="/technical-indicators" component={TechnicalIndicators} />
        <Route path="/telegram-integration" component={TelegramIntegration} />
        <Route path="/template-library" component={TemplateLibrary} />
        <Route path="/terms-acceptance" component={TermsAcceptance} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/testing-framework" component={TestingFramework} />
        <Route path="/text-input-form" component={TextInputForm} />
        <Route path="/text-to-speech" component={TextToSpeech} />
        <Route path="/text-tools" component={TextTools} />
        <Route path="/theme-settings" component={ThemeSettings} />
        <Route path="/thread-management" component={ThreadManagement} />
        <Route path="/ticket-assignment" component={TicketAssignment} />
        <Route path="/ticket-detail" component={TicketDetail} />
        <Route path="/ticket-queue" component={TicketQueue} />
        <Route path="/tier-comparison" component={TierComparison} />
        <Route path="/time-input-form" component={TimeInputForm} />
        <Route path="/time-picker-dialog" component={TimePickerDialog} />
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/timeline-view" component={TimelineView} />
        <Route path="/timeout-error" component={TimeoutError} />
        <Route path="/tip-jar" component={TipJar} />
        <Route path="/toast-notifications" component={ToastNotifications} />
        <Route path="/todo-list" component={TodoList} />
        <Route path="/toggle-switch-form" component={ToggleSwitchForm} />
        <Route path="/token-dashboard" component={TokenDashboard} />
        <Route path="/token-governance" component={TokenGovernance} />
        <Route path="/token-information" component={TokenInformation} />
        <Route path="/token-metrics" component={TokenMetrics} />
        <Route path="/tokenomics-calculator" component={TokenomicsCalculator} />
        <Route path="/tor-bridge" component={TorBridge} />
        <Route path="/tournament-bracket" component={TournamentBracket} />
        <Route path="/tournament-brackets" component={TournamentBrackets} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/trade-history" component={TradeHistory} />
        <Route path="/trading" component={Trading} />
        <Route path="/trading-bots" component={TradingBots} />
        <Route path="/trading-history" component={TradingHistory} />
        <Route path="/trading-terminal" component={TradingTerminal} />
        <Route path="/transaction-explorer" component={TransactionExplorer} />
        <Route path="/transaction-history" component={TransactionHistory} />
        <Route path="/transaction-viewer" component={TransactionViewer} />
        <Route path="/transcription-manager" component={TranscriptionManager} />
        <Route path="/translation-enabled-community" component={TranslationEnabledCommunity} />
        <Route path="/translation-enabled-social-feed" component={TranslationEnabledSocialFeed} />
        <Route path="/transparency-reports" component={TransparencyReports} />
        <Route path="/travel-blog" component={TravelBlog} />
        <Route path="/travel-budget" component={TravelBudget} />
        <Route path="/travel-documents" component={TravelDocuments} />
        <Route path="/travel-photos" component={TravelPhotos} />
        <Route path="/travel-reviews" component={TravelReviews} />
        <Route path="/travel-tips" component={TravelTips} />
        <Route path="/treasury-management" component={TreasuryManagement} />
        <Route path="/trend-analysis" component={TrendAnalysis} />
        <Route path="/trending" component={Trending} />
        <Route path="/trending-content" component={TrendingContent} />
        <Route path="/trending-items" component={TrendingItems} />
        <Route path="/trending-topics" component={TrendingTopics} />
        <Route path="/triggers-actions" component={TriggersActions} />
        <Route path="/trip-planner" component={TripPlanner} />
        <Route path="/trump-mining" component={TrumpMining} />
        <Route path="/trust-safety-dashboard" component={TrustSafetyDashboard} />
        <Route path="/trust-system" component={TrustSystem} />
        <Route path="/two-factor-auth" component={TwoFactorAuth} />
        <Route path="/two-factor-setup" component={TwoFactorSetup} />
        <Route path="/typing-indicators" component={TypingIndicators} />
        <Route path="/unhidden-interface" component={UnhiddenInterface} />
        <Route path="/unhidden-mode" component={UnhiddenMode} />
        <Route path="/unified-feed" component={UnifiedFeed} />
        <Route path="/unified-identity" component={UnifiedIdentity} />
        <Route path="/unified-messaging" component={UnifiedMessaging} />
        <Route path="/unified-payment-ledger" component={UnifiedPaymentLedger} />
        <Route path="/unified-platform-dashboard" component={UnifiedPlatformDashboard} />
        <Route path="/unified-wallet" component={UnifiedWallet} />
        <Route path="/universal-search" component={UniversalSearch} />
        <Route path="/updated-landing-page" component={UpdatedLandingPage} />
        <Route path="/upgrade-downgrade-plan" component={UpgradeDowngradePlan} />
        <Route path="/upscaling" component={Upscaling} />
        <Route path="/user-activity" component={UserActivity} />
        <Route path="/user-behavior" component={UserBehavior} />
        <Route path="/user-bio" component={UserBio} />
        <Route path="/user-directory" component={UserDirectory} />
        <Route path="/user-discovery" component={UserDiscovery} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/user-mentions" component={UserMentions} />
        <Route path="/user-onboarding" component={UserOnboarding} />
        <Route path="/user-permissions" component={UserPermissions} />
        <Route path="/user-profile" component={UserProfile} />
        <Route path="/user-profiles" component={UserProfiles} />
        <Route path="/user-reputation" component={UserReputation} />
        <Route path="/user-search" component={UserSearch} />
        <Route path="/user-stats" component={UserStats} />
        <Route path="/user-suggestions" component={UserSuggestions} />
        <Route path="/user-timeline" component={UserTimeline} />
        <Route path="/v-o-d-archive" component={VODArchive} />
        <Route path="/validator-performance" component={ValidatorPerformance} />
        <Route path="/validator-setup" component={ValidatorSetup} />
        <Route path="/vendor-analytics" component={VendorAnalytics} />
        <Route path="/vendor-directory" component={VendorDirectory} />
        <Route path="/vendor-onboarding" component={VendorOnboarding} />
        <Route path="/vendor-performance" component={VendorPerformance} />
        <Route path="/vendor-verification" component={VendorVerification} />
        <Route path="/venue-management" component={VenueManagement} />
        <Route path="/verification" component={Verification} />
        <Route path="/verification-steps" component={VerificationSteps} />
        <Route path="/verification-system" component={VerificationSystem} />
        <Route path="/version-management" component={VersionManagement} />
        <Route path="/vesting-schedule" component={VestingSchedule} />
        <Route path="/video-area" component={VideoArea} />
        <Route path="/video-call" component={VideoCall} />
        <Route path="/video-chat" component={VideoChat} />
        <Route path="/video-editor" component={VideoEditor} />
        <Route path="/video-player" component={VideoPlayer} />
        <Route path="/video-tools" component={VideoTools} />
        <Route path="/video-tutorials" component={VideoTutorials} />
        <Route path="/video-upload" component={VideoUpload} />
        <Route path="/video-uploader" component={VideoUploader} />
        <Route path="/viewer-metrics" component={ViewerMetrics} />
        <Route path="/virtual-tour" component={VirtualTour} />
        <Route path="/voice-cloning" component={VoiceCloning} />
        <Route path="/voice-commands" component={VoiceCommands} />
        <Route path="/voice-commands-registry" component={VoiceCommandsRegistry} />
        <Route path="/voice-messages" component={VoiceMessages} />
        <Route path="/walkthrough-page" component={WalkthroughPage} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/wallet-connect" component={WalletConnect} />
        <Route path="/wallet-integration" component={WalletIntegration} />
        <Route path="/wallet-overview" component={WalletOverview} />
        <Route path="/warning-dialog" component={WarningDialog} />
        <Route path="/watch-earn" component={WatchEarn} />
        <Route path="/watch-list" component={WatchList} />
        <Route path="/wealth-simulator" component={WealthSimulator} />
        <Route path="/web3-auth" component={Web3Auth} />
        <Route path="/webhook-management" component={WebhookManagement} />
        <Route path="/webhook-manager" component={WebhookManager} />
        <Route path="/webhooks" component={Webhooks} />
        <Route path="/welcome-screen" component={WelcomeScreen} />
        <Route path="/whale-monitor" component={WhaleMonitor} />
        <Route path="/whitelist-management" component={WhitelistManagement} />
        <Route path="/wishlist-management" component={WishlistManagement} />
        <Route path="/workflow-automation" component={WorkflowAutomation} />
        <Route path="/workflow-builder" component={WorkflowBuilder} />
        <Route path="/world-brain" component={WorldBrain} />
        <Route path="/world-simulation-control" component={WorldSimulationControl} />
        <Route path="/yield-farming" component={YieldFarming} />
        <Route path="/zapier-integration" component={ZapierIntegration} />
        <Route path="/zero-knowledge-proof" component={ZeroKnowledgeProof} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
