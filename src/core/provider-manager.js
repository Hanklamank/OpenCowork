import { ClaudeCodeProvider } from '../providers/claude-code.js';
import { OllamaProvider } from '../providers/ollama.js';
import { LLMProvider } from './llm-provider.js';

/**
 * Manages all available LLM providers
 * Handles detection, initialization, and routing
 */
export class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.configs = new Map();
  }

  /**
   * Register all available providers
   */
  async initialize() {
    console.log('🔍 Detecting available LLM providers...');

    // Check for Claude Code
    if (await LLMProvider.isAvailable('claude-code')) {
      this.registerProvider('claude-code', ClaudeCodeProvider);
      console.log('✅ Claude Code detected');
    }

    // Check for Ollama
    if (await LLMProvider.isAvailable('ollama')) {
      this.registerProvider('ollama', OllamaProvider);
      console.log('✅ Ollama detected');
    }

    // Check for OpenAI CLI
    if (await LLMProvider.isAvailable('openai')) {
      // TODO: Implement OpenAI provider
      console.log('⚠️  OpenAI CLI detected but provider not implemented yet');
    }

    // Check for Gemini (gcloud)
    if (await LLMProvider.isAvailable('gcloud')) {
      // TODO: Implement Gemini provider
      console.log('⚠️  Google Cloud CLI detected but Gemini provider not implemented yet');
    }

    console.log(`📊 Total providers available: ${this.providers.size}`);
    
    if (this.providers.size === 0) {
      throw new Error('No LLM providers found! Install claude-code, ollama, or other supported CLIs.');
    }
  }

  /**
   * Register a provider class
   */
  registerProvider(name, ProviderClass) {
    this.providers.set(name, ProviderClass);
  }

  /**
   * Get list of available providers
   */
  getAvailable() {
    return Array.from(this.providers.keys());
  }

  /**
   * Create and configure a provider instance
   */
  async createProvider(name, config = {}) {
    const ProviderClass = this.providers.get(name);
    if (!ProviderClass) {
      throw new Error(`Provider '${name}' not found. Available: ${this.getAvailable().join(', ')}`);
    }

    const provider = new ProviderClass(config);
    this.configs.set(name, config);
    return provider;
  }

  /**
   * Set the active provider
   */
  async setActive(name, config = {}) {
    if (this.activeProvider) {
      await this.activeProvider.terminate();
    }

    this.activeProvider = await this.createProvider(name, config);
    await this.activeProvider.spawn();
    
    console.log(`🎯 Active provider: ${name}`);
    return this.activeProvider;
  }

  /**
   * Get the current active provider
   */
  getActive() {
    if (!this.activeProvider) {
      throw new Error('No active provider set. Call setActive() first.');
    }
    return this.activeProvider;
  }

  /**
   * Execute a task with the active provider
   */
  async executeTask(task, options = {}) {
    const provider = this.getActive();
    
    console.log(`🤖 Executing task with ${provider.name}...`);
    console.log(`📝 Task: ${task}`);
    
    const startTime = Date.now();
    try {
      const result = await provider.prompt(task, options);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Task completed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Task failed:`, error.message);
      throw error;
    }
  }

  /**
   * Cleanup all providers
   */
  async cleanup() {
    if (this.activeProvider) {
      await this.activeProvider.terminate();
      this.activeProvider = null;
    }
  }
}