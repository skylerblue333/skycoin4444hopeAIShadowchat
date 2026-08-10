import crypto from 'crypto';
import { invokeLLM, listLLMModels } from './_core/llm';

interface AITask {
  type: 'workflow' | 'llm_build' | 'chat' | 'gemini' | 'multi_agent' | 'reasoning' | 'local' | 'chain' | 'offline' | 'complex';
  prompt: string;
  context?: Record<string, any>;
}

interface AIResponse {
  result: string;
  model: string;
  tokens: number;
  latency: number;
}

class AdvancedAIBrain {
  private models: Map<string, string> = new Map();
  private cache: Map<string, AIResponse> = new Map();

  async initialize() {
    const { data } = await listLLMModels();
    data.forEach(model => {
      this.models.set(model.id, model.id);
    });
  }

  async intelligentRouter(task: AITask): Promise<string> {
    const complexity = this.analyzeComplexity(task.prompt);
    const length = task.prompt.length;

    if (complexity > 8 || length > 2000) return 'reasoning';
    if (task.type === 'workflow') return 'workflow';
    if (task.type === 'multi_agent') return 'multi_agent';
    if (task.type === 'complex') return 'complex';
    if (complexity > 5) return 'claude';
    
    return 'gpt4';
  }

  private analyzeComplexity(prompt: string): number {
    const keywords = ['analyze', 'reason', 'complex', 'solve', 'optimize', 'strategy'];
    let score = 0;
    keywords.forEach(kw => {
      if (prompt.toLowerCase().includes(kw)) score += 2;
    });
    return Math.min(score + (prompt.length / 100), 10);
  }

  async solve(task: AITask): Promise<AIResponse> {
    const cacheKey = `${task.type}:${task.prompt.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const startTime = Date.now();
    const route = await this.intelligentRouter(task);
    
    let result: string;
    let model: string;

    switch (route) {
      case 'reasoning':
        ({ result, model } = await this.advancedReasoning(task.prompt));
        break;
      case 'multi_agent':
        ({ result, model } = await this.multiAgentOrchestration(task));
        break;
      case 'complex':
        ({ result, model } = await this.complexProblemSolving(task.prompt));
        break;
      case 'claude':
        ({ result, model } = await this.claudeAnalysis(task.prompt));
        break;
      default:
        ({ result, model } = await this.fastResponse(task.prompt));
    }

    const latency = Date.now() - startTime;
    const response: AIResponse = { result, model, tokens: Math.ceil(result.length / 4), latency };
    
    this.cache.set(cacheKey, response);
    return response;
  }

  private async advancedReasoning(prompt: string): Promise<{ result: string; model: string }> {
    const response = await invokeLLM({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'You are an advanced reasoning engine. Provide deep analysis and multi-step solutions.' },
        { role: 'user', content: prompt }
      ],
      reasoning: { effort: 'high' }
    });
    const content = response.choices[0].message.content;
    return { result: typeof content === 'string' ? content : JSON.stringify(content), model: 'gpt-5' };
  }

  private async multiAgentOrchestration(task: AITask): Promise<{ result: string; model: string }> {
    const agents = [
      { role: 'analyst', prompt: `Analyze: ${task.prompt}` },
      { role: 'strategist', prompt: `Strategy for: ${task.prompt}` },
      { role: 'executor', prompt: `Execute plan for: ${task.prompt}` }
    ];

    const results = await Promise.all(
      agents.map(agent =>
        invokeLLM({
          model: 'claude-3-5-sonnet',
          messages: [
            { role: 'system', content: `You are a ${agent.role}. Provide your perspective.` },
            { role: 'user', content: agent.prompt }
          ]
        })
      )
    );

    const combined = results.map(r => {
      const content = r.choices[0].message.content;
      return typeof content === 'string' ? content : JSON.stringify(content);
    }).join('\n\n---\n\n');
    return { result: combined, model: 'multi-agent' };
  }

  private async complexProblemSolving(prompt: string): Promise<{ result: string; model: string }> {
    const response = await invokeLLM({
      model: 'claude-opus',
      messages: [
        { role: 'system', content: 'Solve complex problems with step-by-step reasoning.' },
        { role: 'user', content: prompt }
      ],
      thinking: { type: 'enabled', budget_tokens: 5000 }
    });
    const content = response.choices[0].message.content;
    return { result: typeof content === 'string' ? content : JSON.stringify(content), model: 'claude-opus' };
  }

  private async claudeAnalysis(prompt: string): Promise<{ result: string; model: string }> {
    const response = await invokeLLM({
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'system', content: 'Provide insightful analysis and recommendations.' },
        { role: 'user', content: prompt }
      ]
    });
    const content = response.choices[0].message.content;
    return { result: typeof content === 'string' ? content : JSON.stringify(content), model: 'claude-3-5-sonnet' };
  }

  private async fastResponse(prompt: string): Promise<{ result: string; model: string }> {
    const response = await invokeLLM({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });
    const content = response.choices[0].message.content;
    return { result: typeof content === 'string' ? content : JSON.stringify(content), model: 'gpt-4o-mini' };
  }

  async threatDetection(data: string): Promise<{ threats: string[]; severity: number }> {
    const response = await invokeLLM({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Analyze for security threats. List threats and rate severity 1-10.' },
        { role: 'user', content: data }
      ]
    });
    
    const contentRaw = response.choices[0].message.content;
    const content = typeof contentRaw === 'string' ? contentRaw : JSON.stringify(contentRaw);
    return {
      threats: content.split('\n').filter(line => line.trim()),
      severity: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10
    };
  }

  async codeGeneration(spec: string): Promise<string> {
    const response = await invokeLLM({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Generate production-grade TypeScript code.' },
        { role: 'user', content: `Generate code for: ${spec}` }
      ]
    });
    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  }

  clearCache() {
    this.cache.clear();
  }
}

export const advancedAIBrain = new AdvancedAIBrain();
