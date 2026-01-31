# OpenCowork Setup Guide

## Prerequisites

To use OpenCowork, you need at least one of these LLM CLIs installed:

### Claude Code
```bash
# Install Claude Code (Anthropic's official CLI)
npm install -g @anthropic-ai/claude-code
```

### Ollama (Local LLMs)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download a model
ollama pull llama3:latest
ollama pull codellama
```

### OpenAI CLI
```bash
# Install OpenAI CLI  
pip install openai-cli
# or
npm install -g openai-cli

# Set API key
export OPENAI_API_KEY="your-api-key"
```

### Gemini (Google Cloud)
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud auth login
gcloud config set project your-project-id
```

## Installation

```bash
git clone https://github.com/Hanklamank/OpenCowork.git
cd OpenCowork
npm install
npm link  # Make 'opencowork' command available globally
```

## Quick Test

```bash
# Check available providers
opencowork providers

# Run a simple task
opencowork exec --llm ollama "Say hello and explain what you are"

# Interactive mode
opencowork interactive --llm claude-code
```

## Configuration

Create `~/.opencowork/config.json`:

```json
{
  "defaultProvider": "ollama",
  "providers": {
    "ollama": {
      "model": "llama3:latest"
    },
    "claude-code": {
      "model": "claude-3.5-sonnet"
    }
  },
  "timeout": 60000,
  "workingDirectory": "~/opencowork-workspace"
}
```

## Usage Examples

### File Organization
```bash
opencowork exec --llm claude-code "Organize my Downloads folder by file type and remove duplicates"
```

### Code Analysis  
```bash
opencowork exec --llm ollama "Analyze this project structure and suggest improvements"
```

### Research Task
```bash
opencowork exec --llm gemini "Research AI agent frameworks and create a comparison table"
```

### Programmatic Usage
```javascript
import { OpenCowork } from 'opencowork';

const agent = new OpenCowork();
await agent.initialize();
await agent.setProvider('ollama', { model: 'llama3:70b' });

const result = await agent.execute(
  'Create a summary of this project and suggest next steps'
);

console.log(result.summary);
```

## Troubleshooting

### No Providers Found
- Install at least one LLM CLI (see Prerequisites)
- Check that the CLI is in your PATH: `which ollama` or `which claude-code`

### Task Timeouts
- Increase timeout: `--timeout 120000` (2 minutes)
- Use faster local models for simple tasks
- Use cloud models for complex reasoning

### Permission Errors
- Make sure OpenCowork has access to working directories
- Check file permissions for CLI tools
- Verify API keys are correctly set

## Performance Tips

- **Local tasks**: Use Ollama with fast models (llama3:latest)
- **Complex reasoning**: Use Claude Code or GPT-4
- **Large files**: Use streaming mode where available
- **Batch operations**: Combine related tasks into one request