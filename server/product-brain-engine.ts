/**
 * Product Brain Memory System
 * Institutional memory and versioned playbooks
 * - Versioned playbooks (PRD v1 → v2 → v3)
 * - Auto-created from successful launches
 * - Auto-created from high-performing experiments
 * - Playbook reusability scoring
 */

export interface Playbook {
  id: string;
  name: string;
  category: string;
  version: number;
  description: string;
  createdFrom: 'launch' | 'experiment' | 'manual';
  sourceId?: string;
  successMetrics: PlaybookMetric[];
  steps: PlaybookStep[];
  lessons: string[];
  reusabilityScore: number; // 0-1
  applicableContexts: string[];
  createdDate: Date;
  lastUsedDate?: Date;
  usageCount: number;
}

export interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
  duration: string;
  owner: string;
  dependencies: number[];
  successCriteria: string[];
}

export interface PlaybookMetric {
  metricName: string;
  baseline: number;
  achieved: number;
  unit: string;
}

export interface PlaybookVersion {
  playbook: Playbook;
  previousVersion?: Playbook;
  changes: string[];
  improvementPercentage: number;
}

export interface ReusableWorkflow {
  workflowId: string;
  name: string;
  description: string;
  applicableTo: string[];
  successRate: number;
  averageOutcome: string;
  estimatedEffort: string;
  playbookReferences: string[];
}

export class ProductBrainEngine {
  private playbooks: Map<string, Playbook[]> = new Map();
  private workflows: Map<string, ReusableWorkflow> = new Map();

  constructor() {
    this.initializeSamplePlaybooks();
  }

  /**
   * Initialize sample playbooks
   */
  private initializeSamplePlaybooks(): void {
    // Mobile App Launch Playbook
    const mobilePlaybook: Playbook = {
      id: 'playbook_mobile_v1',
      name: 'Mobile App Launch Playbook',
      category: 'product_launch',
      version: 1,
      description: 'Proven playbook for launching mobile apps based on 3 successful launches',
      createdFrom: 'launch',
      sourceId: 'launch_mobile_2026',
      successMetrics: [
        { metricName: 'App Store rating', baseline: 0, achieved: 4.8, unit: 'stars' },
        { metricName: 'First week downloads', baseline: 0, achieved: 50000, unit: 'downloads' },
        { metricName: 'Day 7 retention', baseline: 0, achieved: 0.68, unit: 'percentage' },
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Beta testing and feedback collection',
          description: 'Release to 1000 beta testers, collect feedback',
          duration: '2 weeks',
          owner: 'QA Team',
          dependencies: [],
          successCriteria: ['Minimum 4.5 star rating', 'Zero critical bugs'],
        },
        {
          stepNumber: 2,
          title: 'App Store optimization',
          description: 'Optimize screenshots, description, keywords',
          duration: '1 week',
          owner: 'Marketing',
          dependencies: [1],
          successCriteria: ['Keyword research complete', 'Screenshots ready'],
        },
        {
          stepNumber: 3,
          title: 'Launch day coordination',
          description: 'Coordinate launch across all channels',
          duration: '1 day',
          owner: 'Product Manager',
          dependencies: [2],
          successCriteria: ['All systems operational', 'Support team ready'],
        },
      ],
      lessons: [
        'Beta testing with real users is critical',
        'App Store optimization drives 40% of downloads',
        'Day 1 support response time affects ratings',
        'Push notification strategy impacts retention',
      ],
      reusabilityScore: 0.95,
      applicableContexts: ['iOS app launch', 'Android app launch', 'Cross-platform launch'],
      createdDate: new Date('2026-03-15'),
      usageCount: 3,
    };

    // Onboarding Optimization Playbook
    const onboardingPlaybook: Playbook = {
      id: 'playbook_onboarding_v2',
      name: 'Onboarding Optimization Playbook',
      category: 'growth_optimization',
      version: 2,
      description: 'Proven playbook for improving onboarding based on 5 successful experiments',
      createdFrom: 'experiment',
      sourceId: 'exp_onboarding_simplified',
      successMetrics: [
        { metricName: 'Activation rate', baseline: 0.32, achieved: 0.42, unit: 'percentage' },
        { metricName: 'Time to first action', baseline: 45, achieved: 27, unit: 'minutes' },
        { metricName: 'Onboarding completion', baseline: 0.68, achieved: 0.85, unit: 'percentage' },
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Simplify onboarding flow',
          description: 'Reduce steps from 5 to 3',
          duration: '1 week',
          owner: 'Product',
          dependencies: [],
          successCriteria: ['3-step flow designed', 'Wireframes approved'],
        },
        {
          stepNumber: 2,
          title: 'Add contextual help',
          description: 'Implement tooltips and in-app guidance',
          duration: '2 weeks',
          owner: 'Frontend',
          dependencies: [1],
          successCriteria: ['Help system implemented', 'UX tested'],
        },
        {
          stepNumber: 3,
          title: 'A/B test and iterate',
          description: 'Run A/B test with 50/50 split',
          duration: '2 weeks',
          owner: 'Growth',
          dependencies: [2],
          successCriteria: ['Statistical significance achieved', 'Winner identified'],
        },
      ],
      lessons: [
        'Reducing steps from 5 to 3 increases activation by 31%',
        'Contextual help improves completion by 25%',
        'Mobile onboarding needs different flow than desktop',
        'First-time user experience is critical for retention',
      ],
      reusabilityScore: 0.88,
      applicableContexts: ['SaaS onboarding', 'Mobile app onboarding', 'Web app onboarding'],
      createdDate: new Date('2026-04-20'),
      lastUsedDate: new Date('2026-06-10'),
      usageCount: 5,
    };

    this.playbooks.set('product_launch', [mobilePlaybook]);
    this.playbooks.set('growth_optimization', [onboardingPlaybook]);
  }

  /**
   * Get playbooks by category
   */
  async getPlaybooks(category?: string): Promise<Playbook[]> {
    if (category) {
      return this.playbooks.get(category) || [];
    }
    return Array.from(this.playbooks.values()).flat();
  }

  /**
   * Get playbook by ID
   */
  async getPlaybook(playbookId: string): Promise<Playbook | null> {
    const allPlaybooks = Array.from(this.playbooks.values()).flat();
    return allPlaybooks.find((p) => p.id === playbookId) || null;
  }

  /**
   * Create playbook from successful launch
   */
  async createPlaybookFromLaunch(launchId: string, launchData: any): Promise<Playbook> {
    const playbook: Playbook = {
      id: `playbook_${launchId}_v1`,
      name: `${launchData.featureName} Launch Playbook`,
      category: 'product_launch',
      version: 1,
      description: `Proven playbook from successful ${launchData.featureName} launch`,
      createdFrom: 'launch',
      sourceId: launchId,
      successMetrics: launchData.metrics || [],
      steps: launchData.steps || [],
      lessons: launchData.lessons || [],
      reusabilityScore: 0.85,
      applicableContexts: [launchData.featureName],
      createdDate: new Date(),
      usageCount: 1,
    };

    const category = 'product_launch';
    const existing = this.playbooks.get(category) || [];
    this.playbooks.set(category, [...existing, playbook]);

    return playbook;
  }

  /**
   * Create playbook from successful experiment
   */
  async createPlaybookFromExperiment(experimentId: string, experimentData: any): Promise<Playbook> {
    const playbook: Playbook = {
      id: `playbook_${experimentId}_v1`,
      name: `${experimentData.experimentName} Playbook`,
      category: 'growth_optimization',
      version: 1,
      description: `Proven playbook from successful ${experimentData.experimentName} experiment`,
      createdFrom: 'experiment',
      sourceId: experimentId,
      successMetrics: experimentData.results || [],
      steps: experimentData.steps || [],
      lessons: experimentData.insights || [],
      reusabilityScore: 0.8,
      applicableContexts: [experimentData.experimentName],
      createdDate: new Date(),
      usageCount: 1,
    };

    const category = 'growth_optimization';
    const existing = this.playbooks.get(category) || [];
    this.playbooks.set(category, [...existing, playbook]);

    return playbook;
  }

  /**
   * Compare playbook versions
   */
  async comparePlaybookVersions(playbookId: string, version1: number, version2: number): Promise<any> {
    return {
      playbook: playbookId,
      version1,
      version2,
      changes: [
        'Added step: "Mobile optimization" (new step 2)',
        'Modified step 3: Reduced duration from 3 weeks to 2 weeks',
        'Updated success criteria for step 1',
        'Added new lesson: "Mobile onboarding needs different flow"',
      ],
      improvementPercentage: 15,
      recommendation: 'Version 2 shows 15% improvement. Recommend upgrading all instances.',
    };
  }

  /**
   * Get reusable workflows
   */
  async getReusableWorkflows(context?: string): Promise<ReusableWorkflow[]> {
    const workflows: ReusableWorkflow[] = [
      {
        workflowId: 'workflow_1',
        name: 'Feature Launch Workflow',
        description: 'End-to-end workflow for launching new features',
        applicableTo: ['Product launch', 'Feature release'],
        successRate: 0.92,
        averageOutcome: 'Successful launch with 4.5+ rating',
        estimatedEffort: '4-6 weeks',
        playbookReferences: ['playbook_mobile_v1'],
      },
      {
        workflowId: 'workflow_2',
        name: 'Growth Optimization Workflow',
        description: 'Workflow for identifying and implementing growth opportunities',
        applicableTo: ['Activation', 'Retention', 'Engagement'],
        successRate: 0.88,
        averageOutcome: '20-40% improvement in target metric',
        estimatedEffort: '3-4 weeks',
        playbookReferences: ['playbook_onboarding_v2'],
      },
    ];

    if (context) {
      return workflows.filter((w) => w.applicableTo.includes(context));
    }
    return workflows;
  }

  /**
   * Get playbook recommendations
   */
  async getPlaybookRecommendations(context: string): Promise<Playbook[]> {
    const allPlaybooks = await this.getPlaybooks();
    return allPlaybooks
      .filter((p) => p.applicableContexts.includes(context))
      .sort((a, b) => b.reusabilityScore - a.reusabilityScore);
  }

  /**
   * Update playbook from usage
   */
  async updatePlaybookFromUsage(playbookId: string, usageData: any): Promise<Playbook> {
    const playbook = await this.getPlaybook(playbookId);
    if (!playbook) throw new Error('Playbook not found');

    playbook.usageCount += 1;
    playbook.lastUsedDate = new Date();

    // Update reusability score based on outcomes
    if (usageData.success) {
      playbook.reusabilityScore = Math.min(playbook.reusabilityScore + 0.05, 1);
    } else {
      playbook.reusabilityScore = Math.max(playbook.reusabilityScore - 0.05, 0);
    }

    return playbook;
  }

  /**
   * Get playbook library statistics
   */
  async getPlaybookLibraryStats(): Promise<any> {
    const allPlaybooks = await this.getPlaybooks();

    return {
      totalPlaybooks: allPlaybooks.length,
      totalVersions: allPlaybooks.reduce((sum, p) => sum + p.version, 0),
      averageReusabilityScore: allPlaybooks.reduce((sum, p) => sum + p.reusabilityScore, 0) / allPlaybooks.length,
      mostUsedPlaybook: allPlaybooks.sort((a, b) => b.usageCount - a.usageCount)[0],
      categories: {
        product_launch: allPlaybooks.filter((p) => p.category === 'product_launch').length,
        growth_optimization: allPlaybooks.filter((p) => p.category === 'growth_optimization').length,
      },
      insights: [
        'Mobile app launch playbook is most reusable (95% score)',
        'Onboarding optimization playbook has highest usage (5 times)',
        'Average playbook improves outcomes by 25-40%',
      ],
    };
  }
}

export const productBrainEngine = new ProductBrainEngine();
