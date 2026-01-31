# OpenCowork Web GUI

**Claude Cowork-inspired web interface** for the OpenCowork multi-LLM agent system.

![OpenCowork Web GUI](https://via.placeholder.com/800x600/667eea/white?text=OpenCowork+Web+GUI)

## Features

🎨 **Modern Design** - Inspired by Claude Cowork's clean interface  
⚡ **Real-time Updates** - WebSocket-powered live task execution  
🤖 **Provider Switching** - Easy LLM provider selection  
📊 **Task Progress** - Visual step-by-step execution tracking  
💬 **Chat Interface** - Natural conversation flow  
📱 **Responsive** - Works on desktop and mobile  

## Quick Start

```bash
# Start the web server
cd OpenCowork
npm install
opencowork web --port 3000

# Or directly
cd web
npm install  
node server.js
```

Open http://localhost:3000 in your browser.

## Interface Overview

### Sidebar
- **Provider List** - Available LLM providers with status indicators
- **Quick Actions** - Switch between providers with one click

### Main Chat
- **Task Input** - Natural language task descriptions
- **Execution Tracking** - Real-time progress updates
- **Step Visualization** - See each step as it executes
- **Results Display** - Formatted output with summaries

### Connection Status
- **Real-time Indicator** - WebSocket connection status
- **Auto-reconnect** - Handles connection drops gracefully

## Usage Examples

### File Organization Task
```
"Organize my Downloads folder by file type and create a summary"
```
**Result**: 
- Creates subdirectories
- Moves files appropriately  
- Generates inventory report
- Shows step-by-step progress

### Code Analysis
```
"Analyze this project structure and suggest improvements"
```
**Result**:
- Scans project files
- Identifies patterns and issues
- Provides recommendations
- Creates action items

### Research & Documentation
```
"Research AI agent frameworks and create a comparison table"
```
**Result**:
- Web searches for information
- Compiles findings
- Creates structured comparison
- Saves as markdown file

## Technical Details

### Backend (server.js)
- **Express.js** server for REST API
- **WebSocket** server for real-time communication
- **Integration** with OpenCowork core
- **Session management** for multiple clients

### Frontend (public/)
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** - Responsive design with animations
- **WebSocket client** - Real-time bidirectional communication
- **Progressive enhancement** - Works without JavaScript for basic features

### API Endpoints

```
GET  /api/providers       # List available LLM providers
POST /api/execute         # Execute task (REST alternative)
GET  /api/status          # System status
GET  /                    # Serve web interface
```

### WebSocket Events

```javascript
// Client → Server
{ type: 'setProvider', provider: 'ollama' }
{ type: 'executeTask', task: 'description', options: {} }
{ type: 'getProviders' }

// Server → Client  
{ type: 'taskStarted', taskId: 'task_123', task: 'description' }
{ type: 'taskStatusChanged', taskId: 'task_123', status: 'executing' }
{ type: 'stepCompleted', taskId: 'task_123', step: { ... } }
{ type: 'taskCompleted', taskId: 'task_123', result: { ... } }
```

## Configuration

Environment variables:
```bash
PORT=3000                 # Web server port
HOST=localhost            # Bind host  
NODE_ENV=production       # Environment mode
```

## Development

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Security

- **No authentication** by default (localhost only)
- **CORS enabled** for development
- **WebSocket origin checking** available
- **Rate limiting** can be added

For production deployment, add authentication and HTTPS.

---

*The web interface provides the same powerful agent capabilities as the CLI, but with a modern, user-friendly interface inspired by Claude Cowork.*