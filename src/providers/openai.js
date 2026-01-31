import { LLMProvider } from '../core/llm-provider.js';

/**
 * OpenAI CLI Provider 
 * Uses the official openai CLI for Codex and GPT models
 */
export class OpenAIProvider extends LLMProvider {
  constructor(config = {}) {
    super({
      name: 'openai',
      cli: 'openai',
      args: ['api', 'chat', 'completions', '--model', config.model || 'gpt-4'],
      model: config.model || 'gpt-4'
    });
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  }

  async spawn() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY environment variable.');
    }

    // Set environment for subprocess
    process.env.OPENAI_API_KEY = this.apiKey;
    
    return super.spawn();
  }

  async waitForReady() {
    // OpenAI CLI is typically ready immediately
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  async prompt(task, options = {}) {
    if (!this.process || !this.isReady) {
      await this.spawn();
    }

    // Format for OpenAI API
    const messages = [
      {
        role: 'system',
        content: 'You are an autonomous agent that executes complex tasks step by step. Break down tasks, plan execution, and provide detailed results.'
      },
      {
        role: 'user', 
        content: `Execute this task: ${task}\n\nProvide a detailed execution plan and then implement it step by step.`
      }
    ];

    // Use OpenAI CLI with JSON messages
    const prompt = JSON.stringify({
      messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7
    });

    return super.prompt(prompt, options);
  }

  /**
   * Alternative: Use curl-based approach for more control
   */
  async directAPICall(task, options = {}) {
    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous agent executing tasks. Break down complex tasks into steps and execute them systematically.'
        },
        {
          role: 'user',
          content: task
        }
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7
    };

    const curlCommand = [
      'curl',
      'https://api.openai.com/v1/chat/completions',
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${this.apiKey}`,
      '-d', JSON.stringify(payload)
    ];

    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const curl = spawn(curlCommand[0], curlCommand.slice(1));
      
      let output = '';
      let error = '';

      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.stderr.on('data', (data) => {
        error += data.toString();
      });

      curl.on('close', (code) => {
        if (code !== 0 || error) {
          reject(new Error(`API call failed: ${error}`));
          return;
        }

        try {
          const response = JSON.parse(output);
          if (response.choices && response.choices[0]) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error('Unexpected API response format'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse API response: ${parseError.message}`));
        }
      });
    });
  }
}