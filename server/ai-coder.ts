import { invokeLLM } from './_core/llm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { notifyOwner } from './_core/notification';

const execAsync = promisify(exec);

interface CodeIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ImprovalLog {
  timestamp: number;
  type: 'bug_fix' | 'optimization' | 'refactor' | 'feature';
  files: string[];
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  changes: string;
}

class AICodeImprover {
  private improvementLogs: ImprovalLog[] = [];
  private maxConcurrentTasks = 3;
  private activeTasks = 0;

  /**
   * Analyze codebase for issues
   */
  async analyzeCodebase(): Promise<CodeIssue[]> {
    
    try {
      // Run TypeScript compiler
      const { stdout: tsOutput } = await execAsync('pnpm tsc --noEmit 2>&1 || true');

      // Parse TypeScript errors
      const issues: CodeIssue[] = [];
      const lines = tsOutput.split('\n');

      for (const line of lines) {
        if (line.includes('error TS')) {
          const match = line.match(/(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
          if (match) {
            issues.push({
              file: match[1],
              line: parseInt(match[2]),
              severity: 'error',
              message: match[5],
            });
          }
        }
      }

      // Run ESLint
      try {
        const { stdout: eslintOutput } = await execAsync('pnpm eslint . --format=json 2>&1 || true');
        const eslintResults = JSON.parse(eslintOutput);

        for (const result of eslintResults) {
          for (const message of result.messages) {
            issues.push({
              file: result.filePath,
              line: message.line,
              severity: message.severity === 2 ? 'error' : 'warning',
              message: message.message,
            });
          }
        }
      } catch (e) {
        // ESLint might not be configured
      }

            return issues;
    } catch (error) {
            return [];
    }
  }

  /**
   * Suggest improvements using LLM
   */
  async suggestImprovements(): Promise<string[]> {
    
    try {
      // Get list of TypeScript files
      const { stdout: files } = await execAsync('find . -name "*.ts" -not -path "./node_modules/*" | head -20');
      const fileList = files.split('\n').filter((f) => f.trim());

      const improvements: string[] = [];

      for (const file of fileList.slice(0, 5)) {
        // Analyze each file with LLM
        const content = readFileSync(file, 'utf-8');
        const preview = content.substring(0, 2000); // First 2000 chars

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content:
                'You are a senior software engineer. Analyze the code and suggest 1-2 specific improvements for performance, readability, or security. Be concise.',
            },
            {
              role: 'user',
              content: `Analyze this code file and suggest improvements:\n\n${preview}`,
            },
          ],
        });

        if (response.choices[0]?.message?.content) {
          improvements.push(`${file}: ${response.choices[0].message.content}`);
        }
      }

      return improvements;
    } catch (error) {
            return [];
    }
  }

  /**
   * Auto-fix common issues
   */
  async autoFixIssues(): Promise<number> {
    
    let fixedCount = 0;

    try {
      // Run prettier for formatting
      await execAsync('pnpm prettier --write . --ignore-path .gitignore 2>&1 || true');
      fixedCount++;

      // Run TypeScript strict mode check
      await execAsync('pnpm tsc --noEmit --strict 2>&1 || true');

      // Run eslint with auto-fix
      await execAsync('pnpm eslint . --fix 2>&1 || true');
      fixedCount++;

            return fixedCount;
    } catch (error) {
            return fixedCount;
    }
  }

  /**
   * Generate performance optimizations
   */
  async optimizePerformance(): Promise<ImprovalLog> {
    
    const log: ImprovalLog = {
      timestamp: Date.now(),
      type: 'optimization',
      files: [],
      description: 'Automated performance optimization pass',
      status: 'in_progress',
      changes: '',
    };

    try {
      // Analyze bundle size
      const { stdout: bundleInfo } = await execAsync('pnpm build 2>&1 | tail -20 || true');

      // Get suggestions from LLM
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'You are a performance optimization expert. Based on bundle info, suggest 2-3 specific optimizations. Be technical and actionable.',
          },
          {
            role: 'user',
            content: `Bundle analysis:\n${bundleInfo}\n\nSuggest specific optimizations.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      log.changes = typeof content === 'string' ? content : 'No suggestions generated';
      log.status = 'completed';

      await notifyOwner({
        title: 'Performance Optimization Suggestions',
        content: log.changes,
      });

      return log;
    } catch (error) {
      log.status = 'failed';
      log.changes = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return log;
    }
  }

  /**
   * Generate test coverage improvements
   */
  async improveTestCoverage(): Promise<ImprovalLog> {
    
    const log: ImprovalLog = {
      timestamp: Date.now(),
      type: 'feature',
      files: [],
      description: 'Test coverage improvement analysis',
      status: 'in_progress',
      changes: '',
    };

    try {
      // Run tests with coverage
      const { stdout: coverage } = await execAsync('pnpm test:coverage 2>&1 || true');

      // Analyze coverage gaps
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a testing expert. Analyze coverage and suggest which areas need more tests.',
          },
          {
            role: 'user',
            content: `Test coverage report:\n${coverage}\n\nSuggest areas for improvement.`,
          },
        ],
      });

      const testContent = response.choices[0]?.message?.content;
      log.changes = typeof testContent === 'string' ? testContent : 'No suggestions generated';
      log.status = 'completed';

      return log;
    } catch (error) {
      log.status = 'failed';
      log.changes = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return log;
    }
  }

  /**
   * Refactor code for maintainability
   */
  async refactorCode(): Promise<ImprovalLog> {
    
    const log: ImprovalLog = {
      timestamp: Date.now(),
      type: 'refactor',
      files: [],
      description: 'Code refactoring analysis',
      status: 'in_progress',
      changes: '',
    };

    try {
      // Find large files that might need refactoring
      const { stdout: largeFiles } = await execAsync(
        'find . -name "*.ts" -not -path "./node_modules/*" -exec wc -l {} + | sort -rn | head -10'
      );

      // Get refactoring suggestions
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'You are a code architecture expert. Suggest specific refactoring improvements for maintainability and modularity.',
          },
          {
            role: 'user',
            content: `Large files needing refactoring:\n${largeFiles}\n\nSuggest refactoring strategies.`,
          },
        ],
      });

      const refactorContent = response.choices[0]?.message?.content;
      log.changes = typeof refactorContent === 'string' ? refactorContent : 'No suggestions generated';
      log.status = 'completed';

      return log;
    } catch (error) {
      log.status = 'failed';
      log.changes = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return log;
    }
  }

  /**
   * Run full improvement cycle
   */
  async runFullCycle(): Promise<ImprovalLog[]> {
    
    const logs: ImprovalLog[] = [];

    try {
      // 1. Analyze issues
      const issues = await this.analyzeCodebase();
      
      // 2. Auto-fix common issues
      await this.autoFixIssues();

      // 3. Generate suggestions
      const suggestions = await this.suggestImprovements();
      
      // 4. Performance optimization
      logs.push(await this.optimizePerformance());

      // 5. Test coverage improvement
      logs.push(await this.improveTestCoverage());

      // 6. Refactoring suggestions
      logs.push(await this.refactorCode());

      // Send summary notification
      const successCount = logs.filter((l) => l.status === 'completed').length;
      await notifyOwner({
        title: 'AI Code Improvement Cycle Complete',
        content: `Analyzed ${issues.length} issues, generated ${suggestions.length} suggestions, completed ${successCount} improvement tasks.`,
      });

      this.improvementLogs.push(...logs);
      return logs;
    } catch (error) {
            await notifyOwner({
        title: 'AI Code Improvement Cycle Failed',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return [];
    }
  }

  /**
   * Get improvement history
   */
  getHistory(limit = 50): ImprovalLog[] {
    return this.improvementLogs.slice(-limit);
  }

  /**
   * Get improvement statistics
   */
  getStatistics() {
    const completed = this.improvementLogs.filter((l) => l.status === 'completed').length;
    const failed = this.improvementLogs.filter((l) => l.status === 'failed').length;
    const pending = this.improvementLogs.filter((l) => l.status === 'pending').length;

    return {
      totalImprovements: this.improvementLogs.length,
      completed,
      failed,
      pending,
      successRate: this.improvementLogs.length > 0 ? (completed / this.improvementLogs.length) * 100 : 0,
    };
  }
}

export const aiCoder = new AICodeImprover();

// REST API routes
import { Router } from 'express';

export const aiCoderRouter = Router();

/**
 * POST /ai-coder/analyze - Analyze codebase
 */
aiCoderRouter.post('/ai-coder/analyze', async (req, res) => {
  try {
    const issues = await aiCoder.analyzeCodebase();
    res.json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /ai-coder/suggest - Get improvement suggestions
 */
aiCoderRouter.post('/ai-coder/suggest', async (req, res) => {
  try {
    const suggestions = await aiCoder.suggestImprovements();
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /ai-coder/autofix - Auto-fix issues
 */
aiCoderRouter.post('/ai-coder/autofix', async (req, res) => {
  try {
    const fixedCount = await aiCoder.autoFixIssues();
    res.json({ success: true, fixedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /ai-coder/optimize - Optimize performance
 */
aiCoderRouter.post('/ai-coder/optimize', async (req, res) => {
  try {
    const log = await aiCoder.optimizePerformance();
    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /ai-coder/cycle - Run full improvement cycle
 */
aiCoderRouter.post('/ai-coder/cycle', async (req, res) => {
  try {
    const logs = await aiCoder.runFullCycle();
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /ai-coder/history - Get improvement history
 */
aiCoderRouter.get('/ai-coder/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = aiCoder.getHistory(limit);
  res.json({ history });
});

/**
 * GET /ai-coder/stats - Get statistics
 */
aiCoderRouter.get('/ai-coder/stats', (req, res) => {
  const stats = aiCoder.getStatistics();
  res.json(stats);
});

export default aiCoderRouter;
