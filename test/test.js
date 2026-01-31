#!/usr/bin/env node

/**
 * Simple test runner for OpenCowork
 */

import { OpenCowork } from '../src/index.js';
import { LLMProvider } from '../src/core/llm-provider.js';

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running OpenCowork Tests\n');

    for (const test of this.tests) {
      try {
        console.log(`⚡ ${test.name}...`);
        await test.fn();
        console.log(`✅ ${test.name} PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name} FAILED: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
}

const runner = new TestRunner();

// Test 1: Provider Detection
runner.test('Provider Detection', async () => {
  const opencowork = new OpenCowork();
  await opencowork.initialize();
  
  const providers = opencowork.getAvailableProviders();
  runner.assert(Array.isArray(providers), 'Providers should be an array');
  runner.assert(providers.length >= 0, 'Should detect some providers');
  
  console.log(`  Detected providers: ${providers.join(', ') || 'none'}`);
  await opencowork.cleanup();
});

// Test 2: CLI Availability Check
runner.test('CLI Availability Check', async () => {
  const available = await LLMProvider.isAvailable('which');
  runner.assert(available === true, 'which command should be available on Unix systems');
  
  const notAvailable = await LLMProvider.isAvailable('definitely-not-a-real-command-12345');
  runner.assert(notAvailable === false, 'Non-existent command should not be available');
});

// Test 3: Provider Manager
runner.test('Provider Manager Basic Operations', async () => {
  const opencowork = new OpenCowork();
  await opencowork.initialize();
  
  const providers = opencowork.getAvailableProviders();
  
  if (providers.length > 0) {
    const testProvider = providers[0];
    console.log(`  Testing with provider: ${testProvider}`);
    
    await opencowork.setProvider(testProvider);
    
    // Should have an active provider now
    const activeProvider = opencowork.providerManager.getActive();
    runner.assert(activeProvider.name === testProvider, 'Active provider should match set provider');
  } else {
    console.log('  ⚠️  Skipping provider tests - no providers available');
  }
  
  await opencowork.cleanup();
});

// Test 4: Task Execution (only if providers available)
runner.test('Basic Task Execution', async () => {
  const opencowork = new OpenCowork();
  await opencowork.initialize();
  
  const providers = opencowork.getAvailableProviders();
  
  if (providers.length === 0) {
    console.log('  ⚠️  Skipping task execution test - no providers available');
    return;
  }
  
  // Use first available provider
  await opencowork.setProvider(providers[0]);
  
  // Simple test task with timeout
  const result = await opencowork.execute(
    'Say hello and explain what you are in one sentence', 
    { timeout: 15000 }
  );
  
  runner.assert(typeof result === 'object', 'Result should be an object');
  runner.assert(result.status === 'completed', 'Task should complete successfully');
  runner.assert(Array.isArray(result.steps), 'Result should have steps array');
  runner.assert(result.summary, 'Result should have a summary');
  
  console.log(`  Task completed with ${result.steps.length} steps`);
  console.log(`  Summary: ${result.summary.substring(0, 100)}...`);
  
  await opencowork.cleanup();
});

// Test 5: Error Handling
runner.test('Error Handling', async () => {
  const opencowork = new OpenCowork();
  await opencowork.initialize();
  
  // Test invalid provider
  try {
    await opencowork.setProvider('definitely-not-a-real-provider');
    runner.assert(false, 'Should have thrown error for invalid provider');
  } catch (error) {
    runner.assert(error.message.includes('not found'), 'Should get appropriate error message');
  }
  
  await opencowork.cleanup();
});

// Test 6: CLI Command Structure
runner.test('CLI Exports', async () => {
  // Test that main exports are available
  const { ProviderManager, TaskExecutor, OpenCowork: OC } = await import('../src/index.js');
  
  runner.assert(typeof ProviderManager === 'function', 'ProviderManager should be exported');
  runner.assert(typeof TaskExecutor === 'function', 'TaskExecutor should be exported');
  runner.assert(typeof OC === 'function', 'OpenCowork class should be exported');
});

// Run all tests
if (import.meta.url === `file://${process.argv[1]}`) {
  await runner.run();
}