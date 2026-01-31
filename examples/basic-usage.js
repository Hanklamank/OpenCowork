#!/usr/bin/env node

/**
 * Basic OpenCowork Usage Examples
 */

import { OpenCowork } from '../src/index.js';

async function basicExample() {
  console.log('🚀 OpenCowork Basic Example\n');

  const opencowork = new OpenCowork();

  try {
    // Initialize and detect providers
    await opencowork.initialize();
    console.log('Available providers:', opencowork.getAvailableProviders());

    // Example 1: File analysis with Ollama
    if (opencowork.getAvailableProviders().includes('ollama')) {
      console.log('\n📁 Example 1: Analyzing project structure with Ollama');
      await opencowork.setProvider('ollama', { model: 'llama3:latest' });
      
      const result1 = await opencowork.execute(
        'Analyze the structure of this OpenCowork project and provide insights about the architecture'
      );
      
      console.log('Result:', result1.summary);
    }

    // Example 2: Code generation with Claude Code
    if (opencowork.getAvailableProviders().includes('claude-code')) {
      console.log('\n💻 Example 2: Code generation with Claude Code');
      await opencowork.setProvider('claude-code');
      
      const result2 = await opencowork.execute(
        'Create a simple Node.js utility function that reads a JSON config file and validates required fields'
      );
      
      console.log('Result:', result2.summary);
    }

    // Example 3: Multi-step task
    console.log('\n🔄 Example 3: Multi-step research task');
    const result3 = await opencowork.execute(
      'Research the latest trends in AI agent frameworks, create a comparison table, and save it as a markdown file'
    );
    
    console.log('Result:', result3.summary);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await opencowork.cleanup();
  }
}

async function advancedExample() {
  console.log('\n🔧 Advanced OpenCowork Usage\n');

  const opencowork = new OpenCowork();

  try {
    await opencowork.initialize();

    // Set up event listeners
    opencowork.taskExecutor.on('taskStarted', (task) => {
      console.log(`🎯 Started: ${task.description}`);
    });

    opencowork.taskExecutor.on('stepCompleted', ({ step, result }) => {
      console.log(`✅ Completed step: ${step.description}`);
    });

    // Complex file organization task
    await opencowork.setProvider('claude-code');
    
    const result = await opencowork.execute(
      `Organize my Downloads folder:
      1. Create subdirectories by file type (documents, images, videos, etc.)
      2. Move files to appropriate directories
      3. Create an inventory report
      4. Remove duplicates if found
      5. Generate cleanup summary`,
      { workingDirectory: '/home/pi/Downloads' }
    );

    console.log('\n📊 Final Result:');
    console.log(result.summary);
    
    console.log('\n📈 Task Statistics:');
    console.log(`- Steps: ${result.steps.length}`);
    console.log(`- Duration: ${new Date(result.endTime) - new Date(result.startTime)}ms`);
    console.log(`- Success rate: ${result.results.filter(r => r.status === 'completed').length}/${result.results.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await opencowork.cleanup();
  }
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎮 Running OpenCowork Examples\n');
  
  await basicExample();
  await advancedExample();
  
  console.log('\n🎉 Examples completed!');
}