import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * Handles complex multi-step task execution
 * Similar to Claude Cowork's agent behavior
 */
export class TaskExecutor extends EventEmitter {
  constructor(providerManager) {
    super();
    this.providerManager = providerManager;
    this.currentTask = null;
    this.taskHistory = [];
    this.workingDirectory = process.cwd();
  }

  /**
   * Execute a complex task with planning and step execution
   */
  async executeTask(taskDescription, options = {}) {
    const task = {
      id: this.generateTaskId(),
      description: taskDescription,
      status: 'planning',
      startTime: new Date().toISOString(),
      steps: [],
      results: [],
      workingDirectory: options.workingDirectory || this.workingDirectory
    };

    this.currentTask = task;
    this.emit('taskStarted', task);

    try {
      // Phase 1: Task Analysis & Planning
      console.log('🧠 Phase 1: Analyzing task and creating execution plan...');
      task.status = 'planning';
      this.emit('taskStatusChanged', task);
      
      const plan = await this.createExecutionPlan(taskDescription);
      task.steps = plan.steps;
      
      console.log(`📋 Execution plan created with ${plan.steps.length} steps`);
      this.logSteps(plan.steps);

      // Phase 2: Step-by-step execution
      console.log('⚡ Phase 2: Executing planned steps...');
      task.status = 'executing';
      this.emit('taskStatusChanged', task);

      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        console.log(`\n🔹 Step ${i + 1}/${task.steps.length}: ${step.description}`);
        
        const stepResult = await this.executeStep(step, task);
        task.results.push(stepResult);
        
        this.emit('stepCompleted', { task, step, result: stepResult });
        
        if (stepResult.status === 'failed' && !step.optional) {
          throw new Error(`Critical step failed: ${stepResult.error}`);
        }
      }

      // Phase 3: Results compilation
      console.log('📊 Phase 3: Compiling final results...');
      task.status = 'finalizing';
      this.emit('taskStatusChanged', task);

      const summary = await this.compileFinalResults(task);
      task.summary = summary;
      task.status = 'completed';
      task.endTime = new Date().toISOString();

      this.taskHistory.push(task);
      this.currentTask = null;
      
      this.emit('taskCompleted', task);
      console.log('✅ Task execution completed successfully!');
      
      return task;

    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      
      console.error('❌ Task execution failed:', error.message);
      this.emit('taskFailed', { task, error });
      
      throw error;
    }
  }

  /**
   * Create detailed execution plan from task description
   */
  async createExecutionPlan(taskDescription) {
    const planningPrompt = `
You are a task planning AI. Break down this complex task into specific, actionable steps.

TASK: ${taskDescription}

Create a detailed execution plan with the following format:
1. Each step should be specific and actionable
2. Include file operations, analysis steps, creation steps
3. Mark optional steps with [OPTIONAL]
4. Include estimated complexity (LOW/MEDIUM/HIGH)

Return your plan as a JSON structure:
{
  "analysis": "Brief analysis of the task",
  "complexity": "LOW|MEDIUM|HIGH",
  "estimatedTime": "time estimate",
  "steps": [
    {
      "id": 1,
      "description": "What to do",
      "type": "file|analysis|creation|web|system",
      "complexity": "LOW|MEDIUM|HIGH",
      "optional": false,
      "dependencies": []
    }
  ]
}

Plan the task execution:`;

    const provider = this.providerManager.getActive();
    const planResponse = await provider.prompt(planningPrompt, { timeout: 30000 });
    
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in planning response');
      }
      
      const plan = JSON.parse(jsonMatch[0]);
      return plan;
    } catch (error) {
      console.warn('⚠️  Failed to parse JSON plan, using fallback approach');
      return this.createFallbackPlan(taskDescription);
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, task) {
    const stepResult = {
      stepId: step.id,
      status: 'running',
      startTime: new Date().toISOString(),
      output: null,
      error: null
    };

    try {
      const stepPrompt = `
Execute this specific step as part of a larger task:

OVERALL TASK: ${task.description}
CURRENT STEP: ${step.description}
STEP TYPE: ${step.type}
WORKING DIRECTORY: ${task.workingDirectory}

Previous steps completed: ${task.results.length}

Instructions:
- Focus ONLY on this specific step
- If it involves file operations, specify exact paths and actions
- If it involves analysis, provide detailed findings
- If it involves creation, produce the actual content
- Be specific and actionable

Execute the step now:`;

      const provider = this.providerManager.getActive();
      const output = await provider.prompt(stepPrompt, { timeout: 60000 });
      
      stepResult.status = 'completed';
      stepResult.output = output;
      stepResult.endTime = new Date().toISOString();
      
      console.log(`  ✅ Step completed successfully`);
      return stepResult;

    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = error.message;
      stepResult.endTime = new Date().toISOString();
      
      console.log(`  ❌ Step failed: ${error.message}`);
      return stepResult;
    }
  }

  /**
   * Compile final results and summary
   */
  async compileFinalResults(task) {
    const summaryPrompt = `
Compile a comprehensive summary of this completed task:

TASK: ${task.description}
STEPS EXECUTED: ${task.steps.length}
SUCCESS RATE: ${task.results.filter(r => r.status === 'completed').length}/${task.results.length}

STEP RESULTS:
${task.results.map((result, i) => `
Step ${i + 1}: ${task.steps[i]?.description || 'Unknown'}
Status: ${result.status}
${result.output ? `Output: ${result.output.substring(0, 200)}...` : ''}
${result.error ? `Error: ${result.error}` : ''}
`).join('\n')}

Provide a concise summary including:
1. What was accomplished
2. Key outcomes/deliverables  
3. Any issues encountered
4. Recommendations for follow-up

Summary:`;

    const provider = this.providerManager.getActive();
    return await provider.prompt(summaryPrompt, { timeout: 30000 });
  }

  /**
   * Create a simple fallback plan when JSON parsing fails
   */
  createFallbackPlan(taskDescription) {
    return {
      analysis: "Fallback plan - JSON parsing failed",
      complexity: "MEDIUM",
      estimatedTime: "5-15 minutes",
      steps: [
        {
          id: 1,
          description: "Analyze the task requirements",
          type: "analysis",
          complexity: "LOW",
          optional: false,
          dependencies: []
        },
        {
          id: 2,
          description: taskDescription,
          type: "execution",
          complexity: "MEDIUM", 
          optional: false,
          dependencies: [1]
        }
      ]
    };
  }

  /**
   * Helper: Log execution steps
   */
  logSteps(steps) {
    steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.description} (${step.complexity})`);
    });
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current task status
   */
  getCurrentTask() {
    return this.currentTask;
  }

  /**
   * Get task history
   */
  getHistory() {
    return this.taskHistory;
  }
}