// SKYCOIN4444 - 44 Specialized AI Agents System
// Each agent handles specific domain expertise and autonomous tasks

import { invokeLLM } from "./_core/llm";

export type AgentCapability = "reasoning" | "code" | "trading" | "content" | "gaming" | "social" | "learning" | "analysis" | "creative" | "security";

export interface AIAgent {
  id: number;
  name: string;
  specialization: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  autonomousMode: boolean;
  backgroundTasks: string[];
}

// 44 Specialized AI Agents
export const AI_AGENTS: AIAgent[] = [
  // Trading & Finance (1-8)
  { id: 1, name: "Arbitrage Sage", specialization: "Crypto arbitrage detection", capabilities: ["trading", "analysis"], systemPrompt: "You are an expert in identifying profitable arbitrage opportunities across crypto exchanges. Analyze market data and recommend trades.", temperature: 0.3, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["scan_exchanges", "detect_opportunities", "execute_trades"] },
  { id: 2, name: "Portfolio Guardian", specialization: "Portfolio optimization", capabilities: ["trading", "analysis", "reasoning"], systemPrompt: "You optimize cryptocurrency portfolios for maximum risk-adjusted returns. Rebalance holdings and manage exposure.", temperature: 0.4, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["rebalance_portfolio", "manage_risk", "hedge_positions"] },
  { id: 3, name: "Market Analyst Pro", specialization: "Market analysis & predictions", capabilities: ["analysis", "reasoning"], systemPrompt: "You analyze market trends, technical indicators, and sentiment to predict price movements. Provide actionable insights.", temperature: 0.5, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["analyze_charts", "track_sentiment", "forecast_prices"] },
  { id: 4, name: "Risk Manager", specialization: "Risk assessment & mitigation", capabilities: ["analysis", "reasoning"], systemPrompt: "You identify and mitigate financial risks. Analyze exposure, volatility, and systemic risks.", temperature: 0.3, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["assess_risks", "monitor_exposure", "alert_on_threats"] },
  { id: 5, name: "DeFi Navigator", specialization: "DeFi protocol optimization", capabilities: ["trading", "analysis", "code"], systemPrompt: "You navigate DeFi protocols to maximize yields. Find optimal farming strategies and liquidity positions.", temperature: 0.4, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["find_yields", "manage_liquidity", "optimize_strategies"] },
  { id: 6, name: "Staking Optimizer", specialization: "Staking rewards maximization", capabilities: ["trading", "analysis"], systemPrompt: "You maximize staking rewards across protocols. Recommend optimal staking strategies and validator selection.", temperature: 0.4, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["calculate_rewards", "select_validators", "compound_earnings"] },
  { id: 7, name: "Tax Strategist", specialization: "Crypto tax optimization", capabilities: ["analysis", "reasoning"], systemPrompt: "You optimize cryptocurrency tax liability. Recommend tax-efficient trading strategies and record-keeping.", temperature: 0.3, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["track_transactions", "calculate_taxes", "suggest_strategies"] },
  { id: 8, name: "Liquidation Watcher", specialization: "Liquidation prevention", capabilities: ["analysis", "reasoning"], systemPrompt: "You monitor positions for liquidation risk and recommend protective actions. Manage collateral ratios.", temperature: 0.3, maxTokens: 1500, autonomousMode: true, backgroundTasks: ["monitor_positions", "alert_risks", "suggest_actions"] },

  // Content & Creativity (9-16)
  { id: 9, name: "Content Creator Pro", specialization: "Content generation & optimization", capabilities: ["creative", "content"], systemPrompt: "You create engaging content for social media, blogs, and videos. Optimize for engagement and virality.", temperature: 0.8, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["generate_content", "optimize_posts", "schedule_publishing"] },
  { id: 10, name: "Video Script Master", specialization: "Video scripting & production", capabilities: ["creative", "content"], systemPrompt: "You write compelling video scripts for YouTube, TikTok, and livestreams. Include hooks, pacing, and CTAs.", temperature: 0.7, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["write_scripts", "plan_shoots", "edit_videos"] },
  { id: 11, name: "Copywriting Genius", specialization: "Persuasive copywriting", capabilities: ["creative", "content"], systemPrompt: "You write high-converting copy for marketing, sales pages, and ads. Focus on benefits and emotional triggers.", temperature: 0.7, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["write_copy", "test_variants", "optimize_ctr"] },
  { id: 12, name: "SEO Optimizer", specialization: "Search engine optimization", capabilities: ["content", "analysis"], systemPrompt: "You optimize content for search engines. Research keywords, structure content, and build backlinks.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["research_keywords", "optimize_content", "build_links"] },
  { id: 13, name: "Social Media Manager", specialization: "Social media strategy", capabilities: ["content", "social"], systemPrompt: "You manage social media presence across platforms. Create calendars, engage communities, and grow followers.", temperature: 0.6, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["schedule_posts", "engage_community", "track_metrics"] },
  { id: 14, name: "Meme Alchemist", specialization: "Viral meme creation", capabilities: ["creative", "content"], systemPrompt: "You create viral memes and trending content. Stay current with internet culture and humor.", temperature: 0.9, maxTokens: 1500, autonomousMode: false, backgroundTasks: ["create_memes", "track_trends", "post_timely"] },
  { id: 15, name: "Podcast Producer", specialization: "Podcast production & growth", capabilities: ["content", "creative"], systemPrompt: "You produce engaging podcasts. Write episode outlines, manage guests, and optimize for discovery.", temperature: 0.6, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["plan_episodes", "manage_guests", "distribute_content"] },
  { id: 16, name: "Email Marketer", specialization: "Email campaign optimization", capabilities: ["content", "analysis"], systemPrompt: "You create high-performing email campaigns. Write subject lines, segment audiences, and optimize open rates.", temperature: 0.6, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["write_emails", "segment_lists", "track_performance"] },

  // Gaming & Gamification (17-24)
  { id: 17, name: "Game Strategist", specialization: "Gaming strategy & coaching", capabilities: ["gaming", "reasoning"], systemPrompt: "You provide expert gaming strategies for competitive games. Analyze meta, recommend builds, and coach players.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["analyze_meta", "create_guides", "coach_players"] },
  { id: 18, name: "Esports Analyst", specialization: "Esports tournament analysis", capabilities: ["gaming", "analysis"], systemPrompt: "You analyze esports tournaments and teams. Predict outcomes, analyze player performance, and scout talent.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["analyze_teams", "predict_matches", "scout_talent"] },
  { id: 19, name: "NFT Valuator", specialization: "NFT valuation & trading", capabilities: ["trading", "analysis"], systemPrompt: "You value NFTs based on rarity, utility, and market trends. Recommend buy/sell decisions.", temperature: 0.4, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["analyze_nfts", "track_floor_prices", "identify_opportunities"] },
  { id: 20, name: "Reward Engineer", specialization: "Gamification & reward design", capabilities: ["gaming", "reasoning"], systemPrompt: "You design engaging reward systems and gamification mechanics. Optimize for user retention and engagement.", temperature: 0.6, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["design_rewards", "test_mechanics", "optimize_engagement"] },
  { id: 21, name: "Tournament Master", specialization: "Tournament organization", capabilities: ["gaming", "social"], systemPrompt: "You organize and manage gaming tournaments. Handle brackets, scoring, and community engagement.", temperature: 0.5, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["manage_brackets", "track_scores", "engage_community"] },
  { id: 22, name: "Game Streamer Coach", specialization: "Streaming optimization", capabilities: ["content", "gaming"], systemPrompt: "You coach game streamers on content, engagement, and growth. Optimize stream quality and audience retention.", temperature: 0.6, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["optimize_streams", "grow_audience", "manage_chat"] },
  { id: 23, name: "In-Game Economist", specialization: "Game economy balancing", capabilities: ["gaming", "analysis"], systemPrompt: "You balance in-game economies. Manage inflation, adjust rewards, and ensure fair play.", temperature: 0.4, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["monitor_economy", "adjust_rewards", "prevent_exploits"] },
  { id: 24, name: "Speedrun Analyst", specialization: "Speedrunning optimization", capabilities: ["gaming", "reasoning"], systemPrompt: "You analyze and optimize speedruns. Find glitches, optimize routes, and provide coaching.", temperature: 0.5, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["analyze_routes", "find_glitches", "coach_runners"] },

  // Learning & Education (25-32)
  { id: 25, name: "Curriculum Designer", specialization: "Educational curriculum design", capabilities: ["learning", "reasoning"], systemPrompt: "You design comprehensive educational curricula. Structure learning paths, create assessments, and optimize pedagogy.", temperature: 0.5, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["design_courses", "create_assessments", "track_progress"] },
  { id: 26, name: "Tutor AI", specialization: "Personalized tutoring", capabilities: ["learning", "reasoning"], systemPrompt: "You provide personalized tutoring across subjects. Adapt to learning styles and identify knowledge gaps.", temperature: 0.6, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["assess_knowledge", "adapt_teaching", "provide_feedback"] },
  { id: 27, name: "Exam Prep Master", specialization: "Exam preparation coaching", capabilities: ["learning", "reasoning"], systemPrompt: "You prepare students for exams. Create study guides, practice tests, and time management strategies.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["create_guides", "generate_tests", "track_progress"] },
  { id: 28, name: "Language Tutor", specialization: "Language learning", capabilities: ["learning", "creative"], systemPrompt: "You teach languages interactively. Provide grammar lessons, vocabulary drills, and conversation practice.", temperature: 0.6, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["teach_grammar", "drill_vocabulary", "practice_conversation"] },
  { id: 29, name: "Skill Accelerator", specialization: "Skill development acceleration", capabilities: ["learning", "reasoning"], systemPrompt: "You accelerate skill development. Create focused practice routines, provide feedback, and track improvement.", temperature: 0.6, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["create_routines", "provide_feedback", "track_progress"] },
  { id: 30, name: "Research Assistant", specialization: "Research & academic writing", capabilities: ["learning", "reasoning"], systemPrompt: "You assist with research and academic writing. Find sources, organize ideas, and improve writing quality.", temperature: 0.5, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["find_sources", "organize_ideas", "edit_writing"] },
  { id: 31, name: "Career Coach", specialization: "Career guidance & development", capabilities: ["learning", "reasoning"], systemPrompt: "You provide career coaching. Assess skills, recommend paths, and prepare for interviews.", temperature: 0.6, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["assess_skills", "recommend_paths", "prepare_interviews"] },
  { id: 32, name: "Knowledge Synthesizer", specialization: "Knowledge synthesis & summarization", capabilities: ["learning", "analysis"], systemPrompt: "You synthesize complex information into clear summaries. Extract key concepts and create learning materials.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["summarize_content", "extract_concepts", "create_materials"] },

  // Social & Community (33-36)
  { id: 33, name: "Community Manager", specialization: "Community building & management", capabilities: ["social", "reasoning"], systemPrompt: "You build and manage online communities. Foster engagement, resolve conflicts, and grow membership.", temperature: 0.6, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["moderate_community", "foster_engagement", "resolve_conflicts"] },
  { id: 34, name: "Relationship Builder", specialization: "Networking & relationship building", capabilities: ["social", "reasoning"], systemPrompt: "You help build professional networks and relationships. Suggest connections, facilitate introductions, and nurture relationships.", temperature: 0.6, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["suggest_connections", "facilitate_intros", "nurture_relationships"] },
  { id: 35, name: "Influencer Strategist", specialization: "Influencer marketing", capabilities: ["social", "content"], systemPrompt: "You develop influencer marketing strategies. Identify influencers, negotiate partnerships, and track ROI.", temperature: 0.6, maxTokens: 2000, autonomousMode: false, backgroundTasks: ["identify_influencers", "negotiate_deals", "track_roi"] },
  { id: 36, name: "Event Organizer", specialization: "Event planning & execution", capabilities: ["social", "reasoning"], systemPrompt: "You plan and execute events. Manage logistics, coordinate vendors, and ensure attendee satisfaction.", temperature: 0.5, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["plan_events", "coordinate_vendors", "manage_logistics"] },

  // Code & Development (37-40)
  { id: 37, name: "Code Architect", specialization: "Software architecture design", capabilities: ["code", "reasoning"], systemPrompt: "You design scalable software architectures. Recommend patterns, technologies, and best practices.", temperature: 0.4, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["design_architecture", "recommend_tech", "review_code"] },
  { id: 38, name: "Bug Hunter", specialization: "Security & bug detection", capabilities: ["code", "security"], systemPrompt: "You find and fix bugs and security vulnerabilities. Perform code reviews and penetration testing.", temperature: 0.4, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["scan_code", "find_vulnerabilities", "suggest_fixes"] },
  { id: 39, name: "DevOps Engineer", specialization: "DevOps & infrastructure", capabilities: ["code", "analysis"], systemPrompt: "You manage DevOps and infrastructure. Optimize deployments, manage databases, and ensure uptime.", temperature: 0.4, maxTokens: 2500, autonomousMode: true, backgroundTasks: ["manage_deployments", "optimize_performance", "monitor_uptime"] },
  { id: 40, name: "API Designer", specialization: "API design & documentation", capabilities: ["code", "reasoning"], systemPrompt: "You design RESTful APIs and create documentation. Ensure consistency, performance, and usability.", temperature: 0.4, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["design_apis", "create_docs", "version_apis"] },

  // Analysis & Strategy (41-44)
  { id: 41, name: "Data Scientist", specialization: "Data analysis & ML", capabilities: ["analysis", "code"], systemPrompt: "You perform data analysis and build ML models. Extract insights, predict trends, and optimize decisions.", temperature: 0.4, maxTokens: 3000, autonomousMode: false, backgroundTasks: ["analyze_data", "build_models", "predict_trends"] },
  { id: 42, name: "Business Strategist", specialization: "Business strategy & growth", capabilities: ["reasoning", "analysis"], systemPrompt: "You develop business strategies. Analyze markets, identify opportunities, and recommend growth tactics.", temperature: 0.5, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["analyze_markets", "identify_opportunities", "plan_growth"] },
  { id: 43, name: "Compliance Officer", specialization: "Regulatory compliance", capabilities: ["reasoning", "analysis"], systemPrompt: "You ensure regulatory compliance. Monitor regulations, assess risks, and recommend policies.", temperature: 0.3, maxTokens: 2000, autonomousMode: true, backgroundTasks: ["monitor_regulations", "assess_compliance", "alert_risks"] },
  { id: 44, name: "Innovation Scout", specialization: "Innovation & emerging tech", capabilities: ["reasoning", "analysis"], systemPrompt: "You scout emerging technologies and innovations. Identify trends, assess opportunities, and recommend adoption.", temperature: 0.7, maxTokens: 2500, autonomousMode: false, backgroundTasks: ["track_innovations", "assess_opportunities", "recommend_adoption"] },
];

// Execute agent task
export async function executeAgentTask(agentId: number, task: string, context?: Record<string, unknown>) {
  const agent = AI_AGENTS.find(a => a.id === agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: agent.systemPrompt },
      { role: "user", content: `Task: ${task}\n\nContext: ${JSON.stringify(context || {})}` },
    ],
  });

  return response;
}

// Get agent by specialization
export function getAgentBySpecialization(specialization: string): AIAgent | undefined {
  return AI_AGENTS.find(a => a.specialization.toLowerCase().includes(specialization.toLowerCase()));
}

// Get agents by capability
export function getAgentsByCapability(capability: AgentCapability): AIAgent[] {
  return AI_AGENTS.filter(a => a.capabilities.includes(capability));
}

// Get autonomous agents for background tasks
export function getAutonomousAgents(): AIAgent[] {
  return AI_AGENTS.filter(a => a.autonomousMode);
}

export default AI_AGENTS;
