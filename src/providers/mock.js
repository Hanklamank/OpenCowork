import { LLMProvider } from '../core/llm-provider.js';

/**
 * Mock LLM Provider for testing and demos
 * Simulates agent-like behavior without external dependencies
 */
export class MockProvider extends LLMProvider {
  constructor(config = {}) {
    super({
      name: 'mock',
      cli: 'mock-llm', 
      args: [],
      model: 'mock-agent-v1'
    });
    this.responses = this.initializeResponses();
  }

  async spawn() {
    console.log('🎭 Mock Provider: Simulating LLM startup...');
    
    // Simulate startup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isReady = true;
    this.emit('ready');
    
    console.log('✅ Mock Provider ready');
    return { mock: true };
  }

  async prompt(task, options = {}) {
    console.log(`🤖 Mock Provider executing: ${task}`);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const response = this.generateResponse(task);
    console.log(`📤 Mock Provider response: ${response.substring(0, 100)}...`);
    
    return response;
  }

  async waitForReady() {
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  generateResponse(task) {
    const taskLower = task.toLowerCase();
    
    // File operations
    if (taskLower.includes('file') || taskLower.includes('folder') || taskLower.includes('organize')) {
      return this.responses.fileOperations;
    }
    
    // Analysis tasks
    if (taskLower.includes('analyz') || taskLower.includes('review') || taskLower.includes('examine')) {
      return this.responses.analysis;
    }
    
    // Research tasks  
    if (taskLower.includes('research') || taskLower.includes('find') || taskLower.includes('search')) {
      return this.responses.research;
    }
    
    // Code tasks
    if (taskLower.includes('code') || taskLower.includes('function') || taskLower.includes('script')) {
      return this.responses.coding;
    }
    
    // Default generic response
    return this.responses.generic.replace('{task}', task);
  }

  initializeResponses() {
    return {
      fileOperations: `
## File Organization Task Completed ✅

**Steps Executed:**
1. 📁 Analyzed current directory structure
2. 🏷️  Categorized files by type (documents, images, videos, archives)
3. 📂 Created organized subdirectories
4. 📦 Moved 47 files to appropriate locations
5. 🧹 Removed 3 duplicate files
6. 📋 Generated inventory report

**Summary:**
- **Processed:** 47 files across 8 file types
- **Created:** 6 new directories
- **Space saved:** 125 MB (duplicates removed)
- **Time taken:** 2.3 seconds

**New structure:**
\`\`\`
Downloads/
├── Documents/ (12 files)
├── Images/ (18 files)  
├── Videos/ (8 files)
├── Archives/ (5 files)
├── Software/ (3 files)
└── Others/ (1 file)
\`\`\`

Organization complete! Your files are now properly categorized. 🎉`,

      analysis: `
## Analysis Complete ✅

**Executive Summary:**
Based on comprehensive analysis of the provided data/content, here are the key findings:

**Key Insights:**
- 📊 **Structure:** Well-organized with clear patterns
- 🎯 **Strengths:** Strong foundation, good practices evident
- ⚠️  **Areas for Improvement:** 3 optimization opportunities identified
- 💡 **Recommendations:** 5 actionable next steps outlined

**Detailed Findings:**
1. **Architecture Review** - Current structure is scalable and maintainable
2. **Performance Analysis** - 87% efficiency rating, room for 15% improvement  
3. **Best Practices** - Following 9/10 industry standards
4. **Risk Assessment** - Low risk profile, 2 minor concerns noted

**Recommendations:**
1. 🔧 Optimize critical path performance
2. 📝 Update documentation gaps
3. 🔒 Enhance security measures
4. 🚀 Consider automation opportunities
5. 📈 Implement monitoring dashboards

**Next Steps:** Priority action items have been created for implementation.`,

      research: `
## Research Task Completed ✅

**Research Summary:** Comprehensive information gathering and analysis completed

**Key Findings:**
- 📚 **Sources Analyzed:** 15+ authoritative sources
- 🔍 **Data Points:** 45+ relevant data points collected
- 📊 **Trends Identified:** 7 major trends in the domain
- 🎯 **Best Practices:** 12 industry best practices documented

**Research Highlights:**
1. **Current State Analysis** - Market is growing 23% YoY
2. **Technology Trends** - AI/ML adoption accelerating rapidly
3. **Industry Leaders** - Top 5 players and their strategies
4. **Future Outlook** - Projected growth and disruption points

**Deliverables Created:**
- 📋 Comprehensive comparison table
- 📈 Trend analysis report  
- 🎯 Strategic recommendations
- 📚 Curated resource list
- 🔗 Reference links and citations

**Files Saved:**
- \`research_summary_${new Date().toISOString().split('T')[0]}.md\`
- \`comparison_table.md\`
- \`resource_links.txt\`

Research complete with actionable insights! 🎉`,

      coding: `
## Code Generation Complete ✅

**Task Summary:** Custom code solution implemented successfully

**Generated Components:**
- 📄 **Main Function:** \`processData.js\` (125 lines)
- 🧪 **Unit Tests:** \`processData.test.js\` (87 lines)  
- 📚 **Documentation:** Inline comments + README
- 🔧 **Configuration:** Environment setup files

**Code Features:**
- ✅ **Error Handling** - Robust error management
- ✅ **Type Safety** - Full TypeScript support  
- ✅ **Performance** - Optimized algorithms
- ✅ **Testing** - 95% test coverage
- ✅ **Documentation** - Comprehensive docs

**Example Implementation:**
\`\`\`javascript
// Generated utility function
const processData = async (input, options = {}) => {
  try {
    const validated = validateInput(input);
    const processed = await transform(validated, options);
    return { success: true, data: processed };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { processData };
\`\`\`

**Installation:**
\`\`\`bash
npm install
npm test
npm start
\`\`\`

Code ready for production use! 🚀`,

      generic: `
## Task Execution Complete ✅

**Task:** {task}

**Summary:**
Successfully analyzed and executed the requested task using advanced AI agent capabilities.

**Steps Performed:**
1. 🧠 **Analysis Phase** - Broke down task requirements
2. 📋 **Planning Phase** - Created detailed execution plan  
3. ⚡ **Execution Phase** - Implemented solution systematically
4. ✅ **Validation Phase** - Verified results and quality
5. 📊 **Summary Phase** - Compiled final deliverables

**Key Outcomes:**
- Task objectives met successfully
- High quality results delivered
- Best practices followed throughout
- Documentation generated
- Ready for next steps

**Recommendations:**
Based on the execution, consider these follow-up actions:
1. Review the delivered results
2. Test the implementation 
3. Integrate with existing workflows
4. Monitor performance metrics
5. Iterate based on feedback

Task completed successfully! Ready for your next challenge. 🎉`
    };
  }

  async terminate() {
    console.log('🎭 Mock Provider: Shutting down...');
    this.isReady = false;
  }

  static async isAvailable() {
    return true; // Mock is always available
  }
}