/**
 * VOICE COMMAND MACROS - PRODUCTION SYSTEM
 * Create and execute custom voice command sequences
 */

import { voiceSystem444 } from './voice-commands-444';

export interface VoiceMacro {
  id: string;
  name: string;
  description: string;
  commands: string[];
  createdBy: string;
  createdAt: number;
  isPublic: boolean;
  executions: number;
}

export class VoiceMacroSystem {
  private macros: Map<string, VoiceMacro>;
  private userMacros: Map<string, string[]>;

  constructor() {
    this.macros = new Map();
    this.userMacros = new Map();
    this.initializeDefaultMacros();
  }

  private initializeDefaultMacros(): void {
    // Morning Routine
    this.createMacro({
      id: 'macro_morning_routine',
      name: 'Morning Routine',
      description: 'Check notifications, read feed, check balance',
      commands: ['check notifications', 'show feed', 'check balance'],
      createdBy: 'system',
      createdAt: Date.now(),
      isPublic: true,
      executions: 0,
    });

    // Trading Sequence
    this.createMacro({
      id: 'macro_trading_sequence',
      name: 'Trading Sequence',
      description: 'Check prices, analyze market, execute trade',
      commands: ['check prices', 'analyze market', 'execute trade'],
      createdBy: 'system',
      createdAt: Date.now(),
      isPublic: true,
      executions: 0,
    });

    // Content Creator Workflow
    this.createMacro({
      id: 'macro_content_workflow',
      name: 'Content Creator Workflow',
      description: 'Start stream, create post, check analytics',
      commands: ['start stream', 'create post', 'check analytics'],
      createdBy: 'system',
      createdAt: Date.now(),
      isPublic: true,
      executions: 0,
    });

    // Gaming Session
    this.createMacro({
      id: 'macro_gaming_session',
      name: 'Gaming Session',
      description: 'Play game, join multiplayer, check rewards',
      commands: ['play game', 'join multiplayer', 'check rewards'],
      createdBy: 'system',
      createdAt: Date.now(),
      isPublic: true,
      executions: 0,
    });

    // Social Engagement
    this.createMacro({
      id: 'macro_social_engagement',
      name: 'Social Engagement',
      description: 'Check messages, respond to comments, create post',
      commands: ['check messages', 'respond to comments', 'create post'],
      createdBy: 'system',
      createdAt: Date.now(),
      isPublic: true,
      executions: 0,
    });
  }

  private createMacro(macro: VoiceMacro): void {
    this.macros.set(macro.id, macro);
    if (!this.userMacros.has(macro.createdBy)) {
      this.userMacros.set(macro.createdBy, []);
    }
    this.userMacros.get(macro.createdBy)!.push(macro.id);
  }

  async executeMacro(macroId: string, userId: string): Promise<any> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      return { error: 'Macro not found' };
    }

    const results = [];
    for (const command of macro.commands) {
      try {
        const result = await voiceSystem444.processVoiceInput(command, {
          userId,
          userRole: 'user',
          input: command,
          confidence: 0.95,
          timestamp: Date.now(),
          device: 'web',
          language: 'en',
        });
        results.push({ command, result });
      } catch (error) {
        results.push({ command, error: String(error) });
      }
    }

    macro.executions++;
    return {
      macroName: macro.name,
      commandsExecuted: macro.commands.length,
      results,
      totalExecutions: macro.executions,
    };
  }

  createUserMacro(
    name: string,
    description: string,
    commands: string[],
    userId: string
  ): VoiceMacro {
    const macro: VoiceMacro = {
      id: `macro_${userId}_${Date.now()}`,
      name,
      description,
      commands,
      createdBy: userId,
      createdAt: Date.now(),
      isPublic: false,
      executions: 0,
    };

    this.createMacro(macro);
    return macro;
  }

  getUserMacros(userId: string): VoiceMacro[] {
    const macroIds = this.userMacros.get(userId) || [];
    return macroIds
      .map((id) => this.macros.get(id))
      .filter((m) => m !== undefined) as VoiceMacro[];
  }

  getPublicMacros(): VoiceMacro[] {
    return Array.from(this.macros.values()).filter((m) => m.isPublic);
  }

  deleteMacro(macroId: string, userId: string): boolean {
    const macro = this.macros.get(macroId);
    if (!macro || macro.createdBy !== userId) {
      return false;
    }

    this.macros.delete(macroId);
    const userMacros = this.userMacros.get(userId) || [];
    this.userMacros.set(
      userId,
      userMacros.filter((id) => id !== macroId)
    );
    return true;
  }

  updateMacro(macroId: string, updates: Partial<VoiceMacro>, userId: string): boolean {
    const macro = this.macros.get(macroId);
    if (!macro || macro.createdBy !== userId) {
      return false;
    }

    Object.assign(macro, updates);
    return true;
  }

  getMacroStats(): any {
    const macros = Array.from(this.macros.values());
    const totalExecutions = macros.reduce((sum, m) => sum + m.executions, 0);
    const mostUsed = macros.sort((a, b) => b.executions - a.executions).slice(0, 5);

    return {
      totalMacros: macros.length,
      publicMacros: macros.filter((m) => m.isPublic).length,
      privateMacros: macros.filter((m) => !m.isPublic).length,
      totalExecutions,
      averageExecutionsPerMacro: totalExecutions / macros.length,
      mostUsedMacros: mostUsed.map((m) => ({
        name: m.name,
        executions: m.executions,
      })),
    };
  }
}

export const voiceMacroSystem = new VoiceMacroSystem();
