import { invokeLLM } from './server/_core/llm';

interface ChainStep {
  name: string;
  prompt: string;
  model?: string;
}

interface ChainResult {
  steps: Map<string, string>;
  finalResult: string;
  totalTokens: number;
}

class LangChainFramework {
  private chains: Map<string, ChainStep[]> = new Map();
  private memory: Map<string, any> = new Map();

  async createChain(chainId: string, steps: ChainStep[]): Promise<void> {
    this.chains.set(chainId, steps);
  }

  async executeChain(chainId: string, initialInput: string): Promise<ChainResult> {
    const steps = this.chains.get(chainId);
    if (!steps) throw new Error('Chain not found');

    const result: ChainResult = {
      steps: new Map(),
      finalResult: '',
      totalTokens: 0
    };

    let currentOutput = initialInput;

    for (const step of steps) {
      const prompt = step.prompt.replace('{input}', currentOutput);
      
      const response = await invokeLLM({
        model: step.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });

      currentOutput = response.choices[0].message.content;
      result.steps.set(step.name, currentOutput);
      result.totalTokens += Math.ceil(currentOutput.length / 4);
    }

    result.finalResult = currentOutput;
    return result;
  }

  storeMemory(key: string, value: any): void {
    this.memory.set(key, value);
  }

  retrieveMemory(key: string): any {
    return this.memory.get(key);
  }

  clearMemory(): void {
    this.memory.clear();
  }
}

export const langchainFramework = new LangChainFramework();
