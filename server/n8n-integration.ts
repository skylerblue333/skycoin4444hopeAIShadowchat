interface WorkflowDefinition {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, any>;
}

interface WorkflowConnection {
  from: string;
  to: string;
}

class N8nWorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, ExecutionResult> = new Map();

  async createWorkflow(definition: WorkflowDefinition): Promise<string> {
    const id = `wf_${Date.now()}`;
    this.workflows.set(id, definition);
    return id;
  }

  async executeWorkflow(workflowId: string, input: Record<string, any>): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const result: ExecutionResult = {
      id: `exec_${Date.now()}`,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      nodeResults: {},
      output: null
    };

    for (const node of workflow.nodes) {
      const nodeResult = await this.executeNode(node, input);
      result.nodeResults[node.id] = nodeResult;
    }

    result.status = 'completed';
    result.endTime = Date.now();
    this.executions.set(result.id, result);
    return result;
  }

  private async executeNode(node: WorkflowNode, input: Record<string, any>): Promise<any> {
    switch (node.type) {
      case 'http':
        return await this.httpNode(node.config, input);
      case 'transform':
        return this.transformNode(node.config, input);
      case 'condition':
        return this.conditionNode(node.config, input);
      case 'database':
        return await this.databaseNode(node.config, input);
      default:
        return input;
    }
  }

  private async httpNode(config: any, input: any): Promise<any> {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body ? JSON.stringify(config.body) : undefined
    });
    return response.json();
  }

  private transformNode(config: any, input: any): any {
    if (config.mapping) {
      const result: Record<string, any> = {};
      Object.entries(config.mapping).forEach(([key, path]) => {
        result[key] = this.getNestedValue(input, path as string);
      });
      return result;
    }
    return input;
  }

  private conditionNode(config: any, input: any): any {
    const condition = config.condition;
    const value = this.getNestedValue(input, condition.field);
    
    if (condition.operator === 'equals' && value === condition.value) {
      return { pass: true, data: input };
    }
    return { pass: false, data: input };
  }

  private async databaseNode(config: any, input: any): Promise<any> {
    return { success: true, data: input };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  nodeResults: Record<string, any>;
  output: any;
}

export const n8nEngine = new N8nWorkflowEngine();
