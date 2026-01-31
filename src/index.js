import { ProviderManager } from './core/provider-manager.js';
import { TaskExecutor } from './core/task-executor.js';

// Export main classes for programmatic usage
export { ProviderManager, TaskExecutor };
export { LLMProvider } from './core/llm-provider.js';

// Export providers
export { ClaudeCodeProvider } from './providers/claude-code.js';
export { OllamaProvider } from './providers/ollama.js';

/**
 * OpenCowork - Multi-LLM Agent System
 * 
 * Usage examples:
 * 
 * // Programmatic usage
 * import { ProviderManager, TaskExecutor } from 'opencowork';
 * 
 * const manager = new ProviderManager();
 * await manager.initialize();
 * await manager.setActive('ollama', { model: 'llama3' });
 * 
 * const executor = new TaskExecutor(manager);
 * const result = await executor.executeTask('Analyze my project files');
 * 
 * // CLI usage
 * npx opencowork exec --llm claude-code "Create a summary of this project"
 * npx opencowork interactive --llm ollama
 */

// Simple API for quick usage
export class OpenCowork {
  constructor() {
    this.providerManager = new ProviderManager();
    this.taskExecutor = new TaskExecutor(this.providerManager);
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.providerManager.initialize();
      this.initialized = true;
    }
    return this;
  }

  async setProvider(name, config = {}) {
    await this.initialize();
    await this.providerManager.setActive(name, config);
    return this;
  }

  async execute(task, options = {}) {
    if (!this.initialized) {
      throw new Error('OpenCowork not initialized. Call initialize() first.');
    }
    return await this.taskExecutor.executeTask(task, options);
  }

  async cleanup() {
    await this.providerManager.cleanup();
  }

  getAvailableProviders() {
    return this.providerManager.getAvailable();
  }
}