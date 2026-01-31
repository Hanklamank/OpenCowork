import { LLMProvider } from '../core/llm-provider.js';

/**
 * Claude Code CLI Provider
 * Uses the claude-code CLI for agent-driven tasks
 */
export class ClaudeCodeProvider extends LLMProvider {
  constructor(config = {}) {
    super({
      name: 'claude-code',
      cli: 'claude-code',
      args: config.args || ['--interactive'],
      model: config.model || 'claude-3.5-sonnet'
    });
  }

  async waitForReady() {
    // Claude Code typically shows a prompt when ready
    return new Promise((resolve) => {
      const checkReady = (data) => {
        if (data.toString().includes('Enter your message') || 
            data.toString().includes('>')) {
          this.process.stdout.off('data', checkReady);
          resolve();
        }
      };
      
      this.process.stdout.on('data', checkReady);
      
      // Fallback timeout
      setTimeout(resolve, 3000);
    });
  }

  async prompt(task, options = {}) {
    if (!this.process || !this.isReady) {
      await this.spawn();
    }

    const enhancedTask = `
Act as an agent executing this task:

TASK: ${task}

Instructions:
- Break down the task into steps
- Execute each step systematically  
- Use available tools (file operations, web search, etc.)
- Provide clear progress updates
- Return final results

Begin execution:
`;

    return super.prompt(enhancedTask, options);
  }
}