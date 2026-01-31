#!/usr/bin/env node

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import OpenCowork core
import { OpenCowork } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Global OpenCowork instance
let opencowork = null;
const activeSessions = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenCowork
async function initializeOpenCowork() {
  try {
    opencowork = new OpenCowork();
    await opencowork.initialize();
    console.log('✅ OpenCowork initialized');
    console.log('Available providers:', opencowork.getAvailableProviders());
  } catch (error) {
    console.error('❌ Failed to initialize OpenCowork:', error.message);
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  const sessionId = generateSessionId();
  activeSessions.set(sessionId, { ws, tasks: [] });
  
  console.log(`🔌 Client connected: ${sessionId}`);
  
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    providers: opencowork ? opencowork.getAvailableProviders() : []
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      await handleWebSocketMessage(sessionId, message);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected: ${sessionId}`);
    activeSessions.delete(sessionId);
  });
});

// Handle WebSocket messages
async function handleWebSocketMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const { ws } = session;

  switch (message.type) {
    case 'setProvider':
      try {
        await opencowork.setProvider(message.provider, message.config);
        ws.send(JSON.stringify({
          type: 'providerSet',
          provider: message.provider,
          config: message.config
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          error: `Failed to set provider: ${error.message}`
        }));
      }
      break;

    case 'executeTask':
      try {
        const taskId = generateTaskId();
        
        // Send task started event
        ws.send(JSON.stringify({
          type: 'taskStarted',
          taskId,
          task: message.task
        }));

        // Set up task event listeners
        opencowork.taskExecutor.on('taskStatusChanged', (task) => {
          ws.send(JSON.stringify({
            type: 'taskStatusChanged',
            taskId,
            status: task.status
          }));
        });

        opencowork.taskExecutor.on('stepCompleted', ({ task, step, result }) => {
          ws.send(JSON.stringify({
            type: 'stepCompleted',
            taskId,
            step: {
              id: step.id,
              description: step.description,
              status: result.status
            }
          }));
        });

        // Execute the task
        const result = await opencowork.execute(message.task, message.options);
        
        // Send completion
        ws.send(JSON.stringify({
          type: 'taskCompleted',
          taskId,
          result: {
            status: result.status,
            summary: result.summary,
            steps: result.steps.length,
            duration: new Date(result.endTime) - new Date(result.startTime)
          }
        }));

      } catch (error) {
        ws.send(JSON.stringify({
          type: 'taskFailed',
          error: error.message
        }));
      }
      break;

    case 'getProviders':
      ws.send(JSON.stringify({
        type: 'providers',
        providers: opencowork ? opencowork.getAvailableProviders() : []
      }));
      break;
  }
}

// REST API Routes
app.get('/api/providers', (req, res) => {
  if (!opencowork) {
    return res.status(500).json({ error: 'OpenCowork not initialized' });
  }
  res.json({ providers: opencowork.getAvailableProviders() });
});

app.post('/api/execute', async (req, res) => {
  if (!opencowork) {
    return res.status(500).json({ error: 'OpenCowork not initialized' });
  }

  const { task, provider, options } = req.body;

  try {
    if (provider) {
      await opencowork.setProvider(provider);
    }

    const result = await opencowork.execute(task, options);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    initialized: !!opencowork,
    providers: opencowork ? opencowork.getAvailableProviders() : [],
    activeSessions: activeSessions.size
  });
});

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper functions
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🌐 OpenCowork Web GUI started on http://localhost:${PORT}`);
  await initializeOpenCowork();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (opencowork) {
    await opencowork.cleanup();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});