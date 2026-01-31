# 🚀 OpenCowork Quick Start

Get up and running with OpenCowork in under 5 minutes!

## 1. Install OpenCowork

```bash
git clone https://github.com/Hanklamank/OpenCowork.git
cd OpenCowork
npm install
```

## 2. Start Web GUI (Demo Mode)

```bash
npm run web
# Opens http://localhost:3000
```

**🎭 Demo Mode:** Works immediately with mock provider - no setup required!

## 3. Install Real LLM Providers (Optional)

For full functionality, install LLM providers:

```bash
# Auto-install script
npm run setup

# Or manually:
# Ollama (Recommended - Local, Free)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:1b

# Claude Code (API key required)  
npm install -g @anthropic-ai/claude-code

# OpenAI CLI (API key required)
pip install openai-cli
```

## 4. Test Your Setup

```bash
# Check available providers
npm run providers

# CLI usage
npx opencowork exec --llm mock "Organize my project files"

# Web GUI 
npm run web  # → http://localhost:3000
```

## Usage Examples

### Web Interface (Like Claude Cowork)
1. Open http://localhost:3000
2. Select a provider from sidebar
3. Type your task: *"Analyze this project and suggest improvements"*
4. Watch it execute step-by-step!

### CLI Interface
```bash
# Interactive mode
npx opencowork interactive --llm ollama

# Direct execution
npx opencowork exec --llm mock "Research AI trends and create summary"

# Background tasks
npx opencowork "Organize my Downloads folder by file type"
```

## What You Can Do

✅ **File Operations** - Organize, analyze, clean up files  
✅ **Code Analysis** - Review projects, suggest improvements  
✅ **Research Tasks** - Gather info, create summaries  
✅ **Documentation** - Generate docs, README files  
✅ **Data Processing** - Clean, transform, analyze data  
✅ **Creative Tasks** - Writing, brainstorming, planning  

## Providers

| Provider | Setup | Best For |
|----------|-------|----------|
| **Mock** | ✅ Built-in | Demo, testing |
| **Ollama** | 1 command | Local LLMs, privacy |
| **Claude Code** | API key | Code tasks, analysis |
| **OpenAI** | API key | General tasks, creative |

## Troubleshooting

### "No providers found"
- Use demo mode: The mock provider always works
- Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
- Run: `npm run setup` for guided installation

### Web GUI not starting
```bash
cd web && npm install
node server.js
```

### Permission errors
```bash
chmod +x scripts/install-providers.sh
sudo chown -R $USER:$USER ~/.ollama
```

## Next Steps

1. **Try the Demo** - Use mock provider to understand the interface
2. **Install Ollama** - Get local LLM running for real tasks  
3. **Explore Examples** - Check `examples/` folder for more use cases
4. **Read Docs** - See `web/README.md` for advanced features

---

**🎉 You're ready!** OpenCowork gives you Claude Cowork-like functionality with any LLM provider.

Need help? Check the full documentation or create an issue on GitHub.