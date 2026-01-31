#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ProviderManager } from './core/provider-manager.js';
import { TaskExecutor } from './core/task-executor.js';

const program = new Command();
const providerManager = new ProviderManager();
const taskExecutor = new TaskExecutor(providerManager);

program
  .name('opencowork')
  .description('Multi-LLM Agent System with native CLI integration')
  .version('0.1.0');

program
  .command('providers')
  .description('List available LLM providers')
  .action(async () => {
    console.log(chalk.blue('🔍 Detecting LLM providers...'));
    
    try {
      await providerManager.initialize();
      const available = providerManager.getAvailable();
      
      if (available.length === 0) {
        console.log(chalk.yellow('⚠️  No providers found!'));
        console.log('Install one of: claude-code, ollama, openai-cli');
        return;
      }
      
      console.log(chalk.green('\n✅ Available providers:'));
      available.forEach(provider => {
        console.log(`  • ${provider}`);
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  });

program
  .command('exec')
  .description('Execute a task with specified LLM')
  .requiredOption('--llm <provider>', 'LLM provider to use')
  .option('--model <model>', 'Specific model to use')
  .option('--timeout <ms>', 'Task timeout in milliseconds', '300000')
  .option('--verbose', 'Verbose output')
  .argument('<task>', 'Task description to execute')
  .action(async (task, options) => {
    const spinner = ora('Initializing OpenCowork...').start();
    
    try {
      // Initialize providers
      await providerManager.initialize();
      spinner.succeed('Providers initialized');
      
      // Check if requested provider is available
      const available = providerManager.getAvailable();
      if (!available.includes(options.llm)) {
        spinner.fail(`Provider '${options.llm}' not available`);
        console.log(`Available: ${available.join(', ')}`);
        return;
      }
      
      // Set active provider
      spinner.start(`Activating ${options.llm}...`);
      const config = options.model ? { model: options.model } : {};
      await providerManager.setActive(options.llm, config);
      spinner.succeed(`${options.llm} activated`);
      
      // Set up event listeners for task execution
      if (options.verbose) {
        taskExecutor.on('taskStarted', (task) => {
          console.log(chalk.cyan(`\n🚀 Task started: ${task.id}`));
        });
        
        taskExecutor.on('taskStatusChanged', (task) => {
          console.log(chalk.blue(`📊 Status: ${task.status}`));
        });
        
        taskExecutor.on('stepCompleted', ({ task, step, result }) => {
          const status = result.status === 'completed' ? '✅' : '❌';
          console.log(`${status} Step ${step.id} completed`);
        });
      }
      
      // Execute task
      console.log(chalk.yellow(`\n🤖 Executing task with ${options.llm}:`));
      console.log(chalk.white(`"${task}"`));
      
      const startTime = Date.now();
      const result = await taskExecutor.executeTask(task, {
        timeout: parseInt(options.timeout)
      });
      
      const duration = Date.now() - startTime;
      
      // Display results
      console.log(chalk.green('\n🎉 Task completed successfully!'));
      console.log(chalk.gray(`⏱️  Duration: ${duration}ms`));
      console.log(chalk.gray(`📊 Steps: ${result.steps.length}`));
      
      if (result.summary) {
        console.log(chalk.cyan('\n📋 Summary:'));
        console.log(result.summary);
      }
      
    } catch (error) {
      spinner.fail('Task execution failed');
      console.error(chalk.red('❌ Error:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    } finally {
      await providerManager.cleanup();
    }
  });

program
  .command('web')
  .description('Start web GUI server')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('--host <host>', 'Host to bind to', 'localhost')
  .action(async (options) => {
    console.log(chalk.blue('🌐 Starting OpenCowork Web GUI...'));
    
    try {
      // Import and start web server
      const { spawn } = await import('child_process');
      const webServer = spawn('node', ['web/server.js'], {
        stdio: 'inherit',
        env: { 
          ...process.env, 
          PORT: options.port,
          HOST: options.host 
        }
      });

      console.log(chalk.green(`✅ Web GUI started on http://${options.host}:${options.port}`));
      
      webServer.on('error', (error) => {
        console.error(chalk.red('❌ Failed to start web server:'), error.message);
      });

      webServer.on('close', (code) => {
        console.log(chalk.blue(`🛑 Web server stopped with code ${code}`));
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.blue('\n🛑 Shutting down web server...'));
        webServer.kill('SIGTERM');
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('interactive')
  .description('Start interactive mode')
  .option('--llm <provider>', 'Default LLM provider')
  .action(async (options) => {
    console.log(chalk.blue('🎮 Starting OpenCowork Interactive Mode'));
    
    try {
      await providerManager.initialize();
      const available = providerManager.getAvailable();
      
      if (available.length === 0) {
        console.log(chalk.red('❌ No providers available!'));
        return;
      }
      
      // Set default provider
      const defaultLLM = options.llm || available[0];
      await providerManager.setActive(defaultLLM);
      
      console.log(chalk.green(`✅ Ready! Active provider: ${defaultLLM}`));
      console.log(chalk.gray('Type "exit" to quit, "providers" to list, "switch <name>" to change provider'));
      console.log(chalk.cyan('\nWhat would you like me to do?'));
      
      // Simple REPL loop
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.blue('opencowork> ')
      });
      
      rl.prompt();
      
      rl.on('line', async (input) => {
        const command = input.trim();
        
        if (command === 'exit') {
          rl.close();
          return;
        }
        
        if (command === 'providers') {
          console.log('Available:', available.join(', '));
          console.log('Active:', providerManager.getActive().name);
          rl.prompt();
          return;
        }
        
        if (command.startsWith('switch ')) {
          const newProvider = command.replace('switch ', '');
          try {
            await providerManager.setActive(newProvider);
            console.log(chalk.green(`Switched to ${newProvider}`));
          } catch (error) {
            console.error(chalk.red('Error:'), error.message);
          }
          rl.prompt();
          return;
        }
        
        if (command) {
          try {
            console.log(chalk.yellow('🤖 Executing...'));
            const result = await taskExecutor.executeTask(command);
            console.log(chalk.green('✅ Done!'));
            if (result.summary) {
              console.log(result.summary);
            }
          } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
          }
        }
        
        rl.prompt();
      });
      
      rl.on('close', () => {
        console.log(chalk.blue('\n👋 Goodbye!'));
        providerManager.cleanup();
        process.exit(0);
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  });

// Default action for no command
program
  .argument('[task]', 'Task to execute')
  .action(async (task) => {
    if (!task) {
      program.help();
      return;
    }
    
    // Default to interactive mode with immediate task
    console.log(chalk.blue('🚀 Quick execution mode'));
    
    try {
      await providerManager.initialize();
      const available = providerManager.getAvailable();
      
      if (available.length === 0) {
        console.log(chalk.red('❌ No providers available!'));
        return;
      }
      
      await providerManager.setActive(available[0]);
      const result = await taskExecutor.executeTask(task);
      
      console.log(chalk.green('✅ Task completed!'));
      if (result.summary) {
        console.log(result.summary);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    } finally {
      await providerManager.cleanup();
    }
  });

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unhandled error:'), error.message);
  providerManager.cleanup();
  process.exit(1);
});

program.parse();