import { spawn } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Base class for LLM CLI providers
 * Handles native CLI spawning and communication
 */
export class LLMProvider extends EventEmitter {
  constructor(config) {
    super();
    this.name = config.name;
    this.cli = config.cli;
    this.args = config.args || [];
    this.model = config.model;
    this.process = null;
    this.isReady = false;
  }

  /**
   * Spawn the LLM CLI process
   */
  async spawn() {
    if (this.process) {
      throw new Error(`Provider ${this.name} is already running`);
    }

    console.log(`🚀 Spawning ${this.name}: ${this.cli} ${this.args.join(' ')}`);
    
    this.process = spawn(this.cli, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    this.process.on('error', (error) => {
      console.error(`❌ Failed to spawn ${this.name}:`, error.message);
      this.emit('error', error);
    });

    this.process.on('close', (code) => {
      console.log(`🔚 ${this.name} process closed with code ${code}`);
      this.process = null;
      this.isReady = false;
      this.emit('close', code);
    });

    // Wait for process to be ready
    await this.waitForReady();
    this.isReady = true;
    this.emit('ready');
    
    return this.process;
  }

  /**
   * Send a prompt/task to the LLM
   */
  async prompt(task, options = {}) {
    if (!this.process || !this.isReady) {
      throw new Error(`Provider ${this.name} is not ready`);
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout: ${this.name} did not respond within ${options.timeout || 30000}ms`));
      }, options.timeout || 30000);

      this.process.stdout.on('data', (data) => {
        output += data.toString();
      });

      this.process.stderr.on('data', (data) => {
        error += data.toString();
      });

      this.process.stdin.write(task + '\n');

      // Wait for completion marker or timeout
      this.process.stdout.once('end', () => {
        clearTimeout(timeout);
        if (error) {
          reject(new Error(`${this.name} error: ${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  /**
   * Wait for the CLI to be ready (override in subclasses)
   */
  async waitForReady() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000); // Default 1s delay
    });
  }

  /**
   * Terminate the LLM process
   */
  async terminate() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
      this.isReady = false;
    }
  }

  /**
   * Check if CLI command is available
   */
  static async isAvailable(cli) {
    return new Promise((resolve) => {
      const check = spawn('which', [cli]);
      check.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }
}