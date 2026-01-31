# OpenCowork

**Multi-LLM Agent System** inspired by Claude Cowork - Native CLI integration for complex, multi-step tasks.

## Features

🤖 **Multi-LLM Support** - Claude Code, Codex, Gemini, Mistral, Ollama  
⚡ **Direct CLI Integration** - Native process spawning (no API limitations)  
🎯 **Agent-Driven Tasks** - Complex multi-step execution  
📁 **File System Integration** - Real file operations  
🔧 **Cross-Platform** - macOS, Windows, Linux  

## Quick Start

```bash
npm install
npm start

# Interactive mode
opencowork --llm claude-code "Analyze this project and create a summary"

# Background task
opencowork --llm ollama --model llama3 "Organize my downloads folder"
```

## Architecture

```
OpenCowork/
├── src/
│   ├── core/           # Agent engine & orchestration
│   ├── providers/      # LLM CLI wrappers
│   ├── tools/          # File, browser, system tools
│   └── ui/             # CLI interface
├── config/             # LLM configurations
└── examples/           # Usage examples
```

## Supported LLMs

| Provider | CLI Command | Status |
|----------|------------|--------|
| Claude Code | `claude-code` | ✅ Ready |
| OpenAI Codex | `openai` | ✅ Ready |
| Gemini | `gcloud ai` | 🚧 WIP |
| Mistral | `mistral-cli` | 🚧 WIP |
| Ollama | `ollama run` | ✅ Ready |

## Philosophy

Like Clawdbot but **provider-agnostic** - Give it a goal, let it work autonomously using the LLM of your choice.

---

*Built with ❤️ for the AI agent community*