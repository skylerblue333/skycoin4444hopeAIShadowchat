import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { competitiveRadarEngine } from './competitive-radar-engine';
import { behavioralIntelligenceEngine } from './behavioral-intelligence-engine';
import { experimentFactoryEngine } from './experiment-factory-engine';
import { narrativeEngine } from './narrative-engine';
import { connectorIntelligenceEngine } from './connector-intelligence-engine';
import { productBrainEngine } from './product-brain-engine';
import { companySimulatorEngine } from './company-simulator-engine';

/**
 * Phase 2-4 tRPC Routers
 * Competitive Radar + Behavioral Intelligence + Experiments + Narrative + Connectors + Product Brain + Company Simulator
 */

export const phase2to4Routers = {
  // Competitive Radar Router
  competitors: router({
    getAllCompetitors: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getAllCompetitors();
    }),

    getCompetitorAnalysis: protectedProcedure
      .input(z.object({ competitorId: z.string() }))
      .query(async ({ input }) => {
        return competitiveRadarEngine.getCompetitorAnalysis(input.competitorId);
      }),

    getWeeklyRadarReport: protectedProcedure.query(async () => {
      return competitiveRadarEngine.generateWeeklyRadarReport();
    }),

    getMarketGaps: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getMarketGaps();
    }),

    getFeatureComparisonMatrix: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getFeatureComparisonMatrix();
    }),

    getPricingComparison: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getPricingComparison();
    }),

    getUIPatternTrends: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getUIPatternTrends();
    }),

    getCompetitivePositioning: protectedProcedure.query(async () => {
      return competitiveRadarEngine.getCompetitivePositioning();
    }),
  }),

  // Behavioral Intelligence Router
  behavioral: router({
    analyzeUserBehavior: protectedProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        return behavioralIntelligenceEngine.analyzeUserBehavior(input.userId);
      }),

    getEmergingPainPatterns: protectedProcedure
      .input(z.object({ periodDays: z.number().default(7), limit: z.number().default(3) }))
      .query(async ({ input }) => {
        return behavioralIntelligenceEngine.getEmergingPainPatterns(input.periodDays, input.limit);
      }),

    getChurnRiskUsers: protectedProcedure
      .input(z.object({ threshold: z.number().default(0.5), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return behavioralIntelligenceEngine.getChurnRiskUsers(input.threshold, input.limit);
      }),

    getPersonaClusters: protectedProcedure.query(async () => {
      return behavioralIntelligenceEngine.getPersonaClusters();
    }),

    getSentimentClustering: protectedProcedure.query(async () => {
      return behavioralIntelligenceEngine.getSentimentClustering();
    }),
  }),

  // Experiment Factory Router
  experiments: router({
    generateExperimentIdeas: protectedProcedure
      .input(z.object({ context: z.string() }))
      .query(async ({ input }) => {
        return experimentFactoryEngine.generateExperimentIdeas(input.context);
      }),

    createExperiment: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          hypothesis: z.string(),
          controlDescription: z.string(),
          treatmentDescription: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const idea = {
          title: input.title,
          description: input.hypothesis,
          hypothesis: input.hypothesis,
          expectedImpact: 'TBD',
          estimatedDuration: '2 weeks',
          difficulty: 'medium' as const,
          priority: 'high' as const,
          successMetrics: ['Conversion', 'Engagement'],
        };
        return experimentFactoryEngine.createExperiment(idea, input.controlDescription, input.treatmentDescription);
      }),

    getExperiments: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return experimentFactoryEngine.getExperiments(input.status);
      }),

    getExperimentResults: protectedProcedure
      .input(z.object({ experimentId: z.string() }))
      .query(async ({ input }) => {
        return experimentFactoryEngine.getExperimentResults(input.experimentId);
      }),

    startExperiment: protectedProcedure
      .input(z.object({ experimentId: z.string() }))
      .mutation(async ({ input }) => {
        return experimentFactoryEngine.startExperiment(input.experimentId);
      }),

    completeExperiment: protectedProcedure
      .input(z.object({ experimentId: z.string() }))
      .mutation(async ({ input }) => {
        return experimentFactoryEngine.completeExperiment(input.experimentId);
      }),

    getExperimentInsights: protectedProcedure
      .input(z.object({ periodDays: z.number().default(30) }))
      .query(async ({ input }) => {
        return experimentFactoryEngine.getExperimentInsights(input.periodDays);
      }),

    getExperimentTemplates: protectedProcedure.query(async () => {
      return experimentFactoryEngine.getExperimentTemplates();
    }),
  }),

  // Narrative Engine Router
  narratives: router({
    generateNarrative: protectedProcedure
      .input(z.object({ featureId: z.string(), featureName: z.string(), context: z.string() }))
      .query(async ({ input }) => {
        return narrativeEngine.generateNarrative(input.featureId, input.featureName, input.context);
      }),

    getPositioningStatement: protectedProcedure
      .input(z.object({ featureName: z.string(), audience: z.string() }))
      .query(async ({ input }) => {
        return narrativeEngine.getPositioningStatement(input.featureName, input.audience);
      }),

    generateMarketingAssets: protectedProcedure
      .input(z.object({ featureName: z.string(), audience: z.string() }))
      .query(async ({ input }) => {
        return narrativeEngine.generateMarketingAssets(input.featureName, input.audience);
      }),

    checkNarrativeConsistency: protectedProcedure
      .input(z.object({ narratives: z.array(z.any()) }))
      .query(async ({ input }) => {
        return narrativeEngine.checkNarrativeConsistency(input.narratives);
      }),

    getNarrativePerformanceInsights: protectedProcedure.query(async () => {
      return narrativeEngine.getNarrativePerformanceInsights();
    }),
  }),

  // Connector Intelligence Router
  connectors: router({
    getSlackInsights: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getSlackInsights();
    }),

    getJiraInsights: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getJiraInsights();
    }),

    getFigmaInsights: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getFigmaInsights();
    }),

    getAsanaInsights: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getAsanaInsights();
    }),

    getAllConnectorInsights: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getAllConnectorInsights();
    }),

    getConnectorHealthDashboard: protectedProcedure.query(async () => {
      return connectorIntelligenceEngine.getConnectorHealthDashboard();
    }),

    getConnectorTrendAnalysis: protectedProcedure
      .input(z.object({ periodDays: z.number().default(30) }))
      .query(async ({ input }) => {
        return connectorIntelligenceEngine.getConnectorTrendAnalysis(input.periodDays);
      }),
  }),

  // Product Brain Router
  productBrain: router({
    getPlaybooks: protectedProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        return productBrainEngine.getPlaybooks(input.category);
      }),

    getPlaybook: protectedProcedure
      .input(z.object({ playbookId: z.string() }))
      .query(async ({ input }) => {
        return productBrainEngine.getPlaybook(input.playbookId);
      }),

    getReusableWorkflows: protectedProcedure
      .input(z.object({ context: z.string().optional() }))
      .query(async ({ input }) => {
        return productBrainEngine.getReusableWorkflows(input.context);
      }),

    getPlaybookRecommendations: protectedProcedure
      .input(z.object({ context: z.string() }))
      .query(async ({ input }) => {
        return productBrainEngine.getPlaybookRecommendations(input.context);
      }),

    getPlaybookLibraryStats: protectedProcedure.query(async () => {
      return productBrainEngine.getPlaybookLibraryStats();
    }),

    comparePlaybookVersions: protectedProcedure
      .input(z.object({ playbookId: z.string(), version1: z.number(), version2: z.number() }))
      .query(async ({ input }) => {
        return productBrainEngine.comparePlaybookVersions(input.playbookId, input.version1, input.version2);
      }),
  }),

  // Company Simulator Router
  simulator: router({
    runSimulation: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .query(async ({ input }) => {
        return companySimulatorEngine.runCompanySimulation(input.prompt);
      }),

    getWhatIfScenario: protectedProcedure
      .input(z.object({ baselinePrompt: z.string(), change: z.string() }))
      .query(async ({ input }) => {
        const baseline = await companySimulatorEngine.runCompanySimulation(input.baselinePrompt);
        return companySimulatorEngine.getWhatIfScenario(baseline, input.change);
      }),

    get90DayForecast: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .query(async ({ input }) => {
        const simulation = await companySimulatorEngine.runCompanySimulation(input.prompt);
        return companySimulatorEngine.get90DayForecast(simulation);
      }),
  }),
};
