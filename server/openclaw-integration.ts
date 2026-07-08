import { invokeLLM } from './server/_core/llm';

interface ReasoningProblem {
  description: string;
  constraints: string[];
  maxSteps: number;
}

interface ReasoningStep {
  stepNumber: number;
  reasoning: string;
  action: string;
  result: string;
}

interface ReasoningSolution {
  problem: string;
  steps: ReasoningStep[];
  finalAnswer: string;
  proofValid: boolean;
}

class OpenClawReasoningEngine {
  async solveProblem(problem: ReasoningProblem): Promise<ReasoningSolution> {
    const solution: ReasoningSolution = {
      problem: problem.description,
      steps: [],
      finalAnswer: '',
      proofValid: false
    };

    let currentState = problem.description;

    for (let i = 0; i < problem.maxSteps; i++) {
      const prompt = `
Problem: ${problem.description}
Constraints: ${problem.constraints.join(', ')}
Current State: ${currentState}

Step ${i + 1}: Provide the next reasoning step, action, and result.`;

      const response = await invokeLLM({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a reasoning engine. Solve problems step by step with clear logic.'
          },
          { role: 'user', content: prompt }
        ],
        reasoning: { effort: 'high' }
      });

      const content = response.choices[0].message.content;
      const step: ReasoningStep = {
        stepNumber: i + 1,
        reasoning: content.substring(0, 200),
        action: content.substring(200, 400),
        result: content.substring(400)
      };

      solution.steps.push(step);
      currentState = step.result;

      if (content.toLowerCase().includes('solution found') || content.toLowerCase().includes('final answer')) {
        break;
      }
    }

    solution.finalAnswer = currentState;
    solution.proofValid = solution.steps.length > 0;
    return solution;
  }

  async validateProof(solution: ReasoningSolution): Promise<boolean> {
    if (solution.steps.length === 0) return false;

    const prompt = `Validate this solution:
Problem: ${solution.problem}
Steps: ${solution.steps.map(s => s.reasoning).join(' -> ')}
Final Answer: ${solution.finalAnswer}

Is this solution valid? Answer yes or no.`;

    const response = await invokeLLM({
      model: 'claude-opus',
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content.toLowerCase().includes('yes');
  }
}

export const openclawEngine = new OpenClawReasoningEngine();
