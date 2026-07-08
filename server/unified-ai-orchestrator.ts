import { advancedAIBrain } from './ai-brain-advanced';
import { n8nEngine } from './n8n-integration';
import { langchainFramework } from './langchain-integration';
import { crewAIOrchestrator } from './crewai-integration';
import { openclawEngine } from './openclaw-integration';

interface UnifiedAIRequest {
  taskType: 'workflow' | 'chain' | 'crew' | 'reasoning' | 'brain';
  input: any;
  config?: Record<string, any>;
}

interface UnifiedAIResponse {
  taskType: string;
  result: any;
  executionTime: number;
  framework: string;
}

class UnifiedAIOrchestrator {
  async execute(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const startTime = Date.now();
    let result: any;
    let framework: string;

    switch (request.taskType) {
      case 'workflow':
        result = await this.executeWorkflow(request);
        framework = 'n8n';
        break;

      case 'chain':
        result = await this.executeChain(request);
        framework = 'LangChain';
        break;

      case 'crew':
        result = await this.executeCrew(request);
        framework = 'CrewAI';
        break;

      case 'reasoning':
        result = await this.executeReasoning(request);
        framework = 'OpenClaw';
        break;

      case 'brain':
        result = await this.executeBrain(request);
        framework = 'AdvancedAIBrain';
        break;

      default:
        throw new Error(`Unknown task type: ${request.taskType}`);
    }

    return {
      taskType: request.taskType,
      result,
      executionTime: Date.now() - startTime,
      framework
    };
  }

  private async executeWorkflow(request: UnifiedAIRequest): Promise<any> {
    const { workflowId, input } = request.input;
    return await n8nEngine.executeWorkflow(workflowId, input);
  }

  private async executeChain(request: UnifiedAIRequest): Promise<any> {
    const { chainId, input } = request.input;
    return await langchainFramework.executeChain(chainId, input);
  }

  private async executeCrew(request: UnifiedAIRequest): Promise<any> {
    const { taskIds } = request.input;
    return await crewAIOrchestrator.executeCrew(taskIds);
  }

  private async executeReasoning(request: UnifiedAIRequest): Promise<any> {
    const { problem } = request.input;
    return await openclawEngine.solveProblem(problem);
  }

  private async executeBrain(request: UnifiedAIRequest): Promise<any> {
    const { task } = request.input;
    return await advancedAIBrain.solve(task);
  }
}

export const unifiedAIOrchestrator = new UnifiedAIOrchestrator();
