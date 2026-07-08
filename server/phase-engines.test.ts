import { describe, it, expect, beforeEach } from 'vitest';
import { livingLoopEngine } from './living-loop-engine';
import { adaptiveRoadmapEngine } from './adaptive-roadmap-engine';
import { multiAgentOrchestrator } from './multi-agent-orchestrator';
import { competitiveRadarEngine } from './competitive-radar-engine';
import { behavioralIntelligenceEngine } from './behavioral-intelligence-engine';
import { experimentFactoryEngine } from './experiment-factory-engine';
import { narrativeEngine } from './narrative-engine';
import { connectorIntelligenceEngine } from './connector-intelligence-engine';
import { productBrainEngine } from './product-brain-engine';
import { companySimulatorEngine } from './company-simulator-engine';

/**
 * Comprehensive test suite for all Phase 1-4 strategic intelligence engines
 */

describe('Phase 1: Living Loop Engine', () => {
  it('should submit feedback and analyze sentiment', async () => {
    const feedback = await livingLoopEngine.submitFeedback(
      'feature_1',
      'user_123',
      5,
      'This feature is amazing!',
      'feature_quality'
    );

    expect(feedback).toBeDefined();
    expect(feedback.sentiment).toBe('positive');
    expect(feedback.rating).toBe(5);
  });

  it('should get feedback summary', async () => {
    const summary = await livingLoopEngine.getFeedbackSummary('feature_1', 30);
    expect(summary).toBeDefined();
    expect(summary.averageRating).toBeGreaterThan(0);
    expect(summary.sentimentBreakdown).toBeDefined();
  });

  it('should detect churn risk signals', async () => {
    const signals = await livingLoopEngine.getChurnRiskSignals('user_123');
    expect(signals).toBeDefined();
    expect(signals.overallRisk).toBeGreaterThanOrEqual(0);
    expect(signals.overallRisk).toBeLessThanOrEqual(1);
  });
});

describe('Phase 1: Adaptive Roadmap Engine', () => {
  it('should get prioritized roadmap', async () => {
    const roadmap = await adaptiveRoadmapEngine.getPrioritizedRoadmap();
    expect(roadmap).toBeDefined();
    expect(Array.isArray(roadmap)).toBe(true);
    expect(roadmap.length).toBeGreaterThan(0);
  });

  it('should simulate outcome of feature', async () => {
    const outcome = await adaptiveRoadmapEngine.simulateOutcome('item_1');
    expect(outcome).toBeDefined();
    expect(outcome.prediction).toBeDefined();
    expect(outcome.recommendation).toBeDefined();
  });

  it('should get roadmap metrics', async () => {
    const metrics = await adaptiveRoadmapEngine.getRoadmapMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.totalItems).toBeGreaterThan(0);
    expect(metrics.averageFeedbackScore).toBeGreaterThanOrEqual(0);
  });

  it('should forecast quarterly roadmap', async () => {
    const forecast = await adaptiveRoadmapEngine.forecastRoadmap(13);
    expect(forecast).toBeDefined();
    expect(forecast.quarterWeeks).toBe(13);
    expect(forecast.utilizationRate).toBeGreaterThanOrEqual(0);
  });
});

describe('Phase 1: Multi-Agent Orchestrator', () => {
  it('should run agent debate', async () => {
    const debate = await multiAgentOrchestrator.runAgentDebate('Should we launch mobile app?');
    expect(debate).toBeDefined();
    expect(debate.agentPerspectives).toBeDefined();
    expect(debate.agentPerspectives.length).toBe(5);
    expect(debate.consensusLevel).toBeGreaterThanOrEqual(0);
    expect(debate.consensusLevel).toBeLessThanOrEqual(1);
  });

  it('should get individual agent perspective', async () => {
    const perspective = await multiAgentOrchestrator.getAgentPerspective(
      'Market Analyst',
      'Should we expand to Europe?'
    );
    expect(perspective).toBeDefined();
    expect(perspective.agentRole).toBe('Market Analyst');
    expect(perspective.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should simulate team discussion', async () => {
    const discussion = await multiAgentOrchestrator.simulateTeamDiscussion('Feature prioritization');
    expect(discussion).toBeDefined();
    expect(discussion.discussionLog).toBeDefined();
    expect(discussion.consensusReached).toBe(true);
  });
});

describe('Phase 2: Competitive Radar Engine', () => {
  it('should get all competitors', async () => {
    const competitors = await competitiveRadarEngine.getAllCompetitors();
    expect(competitors).toBeDefined();
    expect(Array.isArray(competitors)).toBe(true);
  });

  it('should generate weekly radar report', async () => {
    const report = await competitiveRadarEngine.generateWeeklyRadarReport();
    expect(report).toBeDefined();
    expect(report.keyChanges).toBeDefined();
    expect(report.emergingGaps).toBeDefined();
  });

  it('should get market gaps', async () => {
    const gaps = await competitiveRadarEngine.getMarketGaps();
    expect(gaps).toBeDefined();
    expect(Array.isArray(gaps)).toBe(true);
  });

  it('should get pricing comparison', async () => {
    const comparison = await competitiveRadarEngine.getPricingComparison();
    expect(comparison).toBeDefined();
    expect(comparison.marketAverage).toBeGreaterThan(0);
  });
});

describe('Phase 2: Behavioral Intelligence Engine', () => {
  it('should analyze user behavior', async () => {
    const analysis = await behavioralIntelligenceEngine.analyzeUserBehavior('user_123');
    expect(analysis).toBeDefined();
    expect(analysis.behaviorProfile).toBeDefined();
    expect(analysis.churnRisk).toBeDefined();
    expect(analysis.personaCluster).toBeDefined();
  });

  it('should get emerging pain patterns', async () => {
    const patterns = await behavioralIntelligenceEngine.getEmergingPainPatterns(7, 3);
    expect(patterns).toBeDefined();
    expect(Array.isArray(patterns)).toBe(true);
  });

  it('should get churn risk users', async () => {
    const users = await behavioralIntelligenceEngine.getChurnRiskUsers(0.5, 20);
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBe(true);
  });

  it('should get persona clusters', async () => {
    const personas = await behavioralIntelligenceEngine.getPersonaClusters();
    expect(personas).toBeDefined();
    expect(Array.isArray(personas)).toBe(true);
  });
});

describe('Phase 2: Experiment Factory Engine', () => {
  it('should generate experiment ideas', async () => {
    const ideas = await experimentFactoryEngine.generateExperimentIdeas('Improve onboarding');
    expect(ideas).toBeDefined();
    expect(Array.isArray(ideas)).toBe(true);
    expect(ideas.length).toBeGreaterThan(0);
  });

  it('should get experiments', async () => {
    const experiments = await experimentFactoryEngine.getExperiments();
    expect(experiments).toBeDefined();
    expect(Array.isArray(experiments)).toBe(true);
  });

  it('should get experiment templates', async () => {
    const templates = await experimentFactoryEngine.getExperimentTemplates();
    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
  });
});

describe('Phase 3: Narrative Engine', () => {
  it('should generate narrative for feature', async () => {
    const narrative = await narrativeEngine.generateNarrative(
      'feature_1',
      'Mobile App',
      'Launch mobile app for iOS and Android'
    );
    expect(narrative).toBeDefined();
    expect(narrative.narrativeVariants).toBeDefined();
    expect(narrative.narrativeVariants.length).toBe(4);
  });

  it('should get positioning statement', async () => {
    const positioning = await narrativeEngine.getPositioningStatement('Mobile App', 'enterprise');
    expect(positioning).toBeDefined();
    expect(positioning.forAudience).toBeDefined();
  });

  it('should generate marketing assets', async () => {
    const assets = await narrativeEngine.generateMarketingAssets('Mobile App', 'startup');
    expect(assets).toBeDefined();
    expect(Array.isArray(assets)).toBe(true);
  });
});

describe('Phase 3: Connector Intelligence Engine', () => {
  it('should get Slack insights', async () => {
    const insights = await connectorIntelligenceEngine.getSlackInsights();
    expect(insights).toBeDefined();
    expect(insights.connectorType).toBe('Slack');
    expect(insights.frustrationPatterns).toBeDefined();
  });

  it('should get Jira insights', async () => {
    const insights = await connectorIntelligenceEngine.getJiraInsights();
    expect(insights).toBeDefined();
    expect(insights.connectorType).toBe('Jira');
    expect(insights.bottlenecks).toBeDefined();
  });

  it('should get all connector insights', async () => {
    const insights = await connectorIntelligenceEngine.getAllConnectorInsights();
    expect(insights).toBeDefined();
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBe(4);
  });

  it('should get connector health dashboard', async () => {
    const dashboard = await connectorIntelligenceEngine.getConnectorHealthDashboard();
    expect(dashboard).toBeDefined();
    expect(dashboard.connectorHealth).toBeDefined();
  });
});

describe('Phase 3: Product Brain Engine', () => {
  it('should get playbooks', async () => {
    const playbooks = await productBrainEngine.getPlaybooks();
    expect(playbooks).toBeDefined();
    expect(Array.isArray(playbooks)).toBe(true);
  });

  it('should get reusable workflows', async () => {
    const workflows = await productBrainEngine.getReusableWorkflows();
    expect(workflows).toBeDefined();
    expect(Array.isArray(workflows)).toBe(true);
  });

  it('should get playbook library stats', async () => {
    const stats = await productBrainEngine.getPlaybookLibraryStats();
    expect(stats).toBeDefined();
    expect(stats.totalPlaybooks).toBeGreaterThanOrEqual(0);
  });
});

describe('Phase 4: Company Simulator Engine', () => {
  it('should run company simulation', async () => {
    const simulation = await companySimulatorEngine.runCompanySimulation('Launch mobile app');
    expect(simulation).toBeDefined();
    expect(simulation.teamSimulations).toBeDefined();
    expect(simulation.overallOutcome).toBeDefined();
    expect(simulation.riskFactors).toBeDefined();
  });

  it('should get 90-day forecast', async () => {
    const simulation = await companySimulatorEngine.runCompanySimulation('Expand to Europe');
    const forecast = await companySimulatorEngine.get90DayForecast(simulation);
    expect(forecast).toBeDefined();
    expect(forecast.weeklyMilestones).toBeDefined();
    expect(forecast.weeklyMilestones.length).toBe(12);
  });
});

describe('Integration: All Engines Together', () => {
  it('should orchestrate all engines for strategic decision', async () => {
    // Run all engines in parallel
    const [debate, roadmap, radar, behavioral, experiments, narrative, connectors, brain, simulator] =
      await Promise.all([
        multiAgentOrchestrator.runAgentDebate('Launch new feature'),
        adaptiveRoadmapEngine.getPrioritizedRoadmap(),
        competitiveRadarEngine.generateWeeklyRadarReport(),
        behavioralIntelligenceEngine.getPersonaClusters(),
        experimentFactoryEngine.generateExperimentIdeas('Growth'),
        narrativeEngine.generateNarrative('feature_1', 'New Feature', 'Launch new feature'),
        connectorIntelligenceEngine.getAllConnectorInsights(),
        productBrainEngine.getPlaybooks(),
        companySimulatorEngine.runCompanySimulation('Launch new feature'),
      ]);

    // Verify all engines returned data
    expect(debate).toBeDefined();
    expect(roadmap).toBeDefined();
    expect(radar).toBeDefined();
    expect(behavioral).toBeDefined();
    expect(experiments).toBeDefined();
    expect(narrative).toBeDefined();
    expect(connectors).toBeDefined();
    expect(brain).toBeDefined();
    expect(simulator).toBeDefined();

    // Verify consensus and recommendations
    expect(debate.consensusLevel).toBeGreaterThan(0.7);
    expect(simulator.overallOutcome.recommendations).toBeDefined();
  });
});
