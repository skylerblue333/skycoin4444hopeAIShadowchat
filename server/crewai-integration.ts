import { invokeLLM } from './server/_core/llm';

interface Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
}

interface Task {
  id: string;
  description: string;
  agentId: string;
  expectedOutput: string;
}

interface CrewResult {
  taskId: string;
  agentId: string;
  result: string;
  reasoning: string;
}

class CrewAIOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private results: CrewResult[] = [];

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  createTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  async executeCrew(taskIds: string[]): Promise<CrewResult[]> {
    const results: CrewResult[] = [];

    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId);
      if (!task) continue;

      const agent = this.agents.get(task.agentId);
      if (!agent) continue;

      const prompt = `
Role: ${agent.role}
Goal: ${agent.goal}
Backstory: ${agent.backstory}

Task: ${task.description}
Expected Output: ${task.expectedOutput}

Provide your analysis and solution:`;

      const response = await invokeLLM({
        model: 'claude-3-5-sonnet',
        messages: [{ role: 'user', content: prompt }]
      });

      const result: CrewResult = {
        taskId,
        agentId: task.agentId,
        result: response.choices[0].message.content,
        reasoning: `Executed by ${agent.role}`
      };

      results.push(result);
      this.results.push(result);
    }

    return results;
  }

  getResults(): CrewResult[] {
    return this.results;
  }

  clearResults(): void {
    this.results = [];
  }
}

export const crewAIOrchestrator = new CrewAIOrchestrator();
