import { LLMProvider } from '../core/llm-provider.js';

/**
 * Ollama CLI Provider
 * Uses local Ollama models for agent tasks
 */
export class OllamaProvider extends LLMProvider {
  constructor(config = {}) {
    super({
      name: 'ollama',
      cli: 'ollama',
      args: ['run', config.model || 'llama3:latest'],
      model: config.model || 'llama3:latest'
    });
  }

  async waitForReady() {
    // Ollama shows ">>>" prompt when ready
    return new Promise((resolve) => {
      let buffer = '';
      
      const checkReady = (data) => {
        buffer += data.toString();
        if (buffer.includes('>>>') || buffer.includes('Send a message')) {
          this.process.stdout.off('data', checkReady);
          resolve();
        }
      };
      
      this.process.stdout.on('data', checkReady);
      
      // Longer timeout for model loading
      setTimeout(resolve, 10000);
    });
  }

  async prompt(task, options = {}) {
    if (!this.process || !this.isReady) {
      await this.spawn();
    }

    // Ollama-optimized prompt for agent behavior
    const enhancedTask = `You are an autonomous agent executing tasks. Follow these steps:

1. ANALYZE: Break down this task: "${task}"
2. PLAN: List the specific steps needed
3. EXECUTE: Perform each step systematically
4. REPORT: Summarize what was accomplished

Focus on practical execution. If you need file operations or system access, describe the exact commands/actions needed.

Task: ${task}

Begin analysis and execution:`;

    return super.prompt(enhancedTask, { ...options, timeout: 60000 });
  }

  async streamingPrompt(task, onChunk) {
    if (!this.process || !this.isReady) {
      await this.spawn();
    }

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      this.process.stdout.on('data', (data) => {
        const chunk = data.toString();
        fullResponse += chunk;
        if (onChunk) onChunk(chunk);
      });

      this.process.stdout.once('end', () => {
        resolve(fullResponse.trim());
      });

      this.process.stdin.write(task + '\n');
    });
  }
}