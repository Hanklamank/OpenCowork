class OpenCoworkApp {
    constructor() {
        this.ws = null;
        this.sessionId = null;
        this.activeProvider = null;
        this.currentTask = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectWebSocket();
    }

    initializeElements() {
        this.elements = {
            providerList: document.getElementById('providerList'),
            messages: document.getElementById('messages'),
            taskInput: document.getElementById('taskInput'),
            sendButton: document.getElementById('sendButton'),
            connectionDot: document.getElementById('connectionDot'),
            connectionStatus: document.getElementById('connectionStatus')
        };
    }

    setupEventListeners() {
        // Send button click
        this.elements.sendButton.addEventListener('click', () => {
            this.sendTask();
        });

        // Enter key in textarea (Shift+Enter for new line)
        this.elements.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTask();
            }
        });

        // Auto-resize textarea
        this.elements.taskInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        // Initial button state
        this.updateSendButton();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.updateConnectionStatus('connected', 'Connected');
                console.log('✅ WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            };

            this.ws.onclose = () => {
                this.updateConnectionStatus('disconnected', 'Disconnected');
                console.log('❌ WebSocket disconnected');
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    this.connectWebSocket();
                }, 3000);
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('disconnected', 'Connection Error');
            };

        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.updateConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    handleWebSocketMessage(message) {
        console.log('📥 Received:', message);

        switch (message.type) {
            case 'connected':
                this.sessionId = message.sessionId;
                this.updateProviderList(message.providers);
                break;

            case 'providers':
                this.updateProviderList(message.providers);
                break;

            case 'providerSet':
                this.activeProvider = message.provider;
                this.updateActiveProvider(message.provider);
                break;

            case 'taskStarted':
                this.currentTask = {
                    id: message.taskId,
                    description: message.task,
                    status: 'planning',
                    steps: []
                };
                this.addMessage('system', `🚀 Task started: ${message.task}`, {
                    taskId: message.taskId,
                    status: 'planning'
                });
                break;

            case 'taskStatusChanged':
                if (this.currentTask && this.currentTask.id === message.taskId) {
                    this.currentTask.status = message.status;
                    this.updateTaskStatus(message.taskId, message.status);
                }
                break;

            case 'stepCompleted':
                if (this.currentTask && this.currentTask.id === message.taskId) {
                    this.currentTask.steps.push(message.step);
                    this.updateTaskSteps(message.taskId, message.step);
                }
                break;

            case 'taskCompleted':
                this.addMessage('assistant', `✅ Task completed successfully!\\n\\n${message.result.summary}`, {
                    taskId: message.taskId,
                    result: message.result
                });
                this.currentTask = null;
                this.elements.sendButton.disabled = false;
                break;

            case 'taskFailed':
                this.addMessage('assistant', `❌ Task failed: ${message.error}`, {
                    taskId: message.taskId,
                    error: message.error
                });
                this.currentTask = null;
                this.elements.sendButton.disabled = false;
                break;

            case 'error':
                this.addMessage('system', `⚠️ Error: ${message.error}`);
                this.elements.sendButton.disabled = false;
                break;
        }
    }

    updateProviderList(providers) {
        this.elements.providerList.innerHTML = '';
        
        if (providers.length === 0) {
            this.elements.providerList.innerHTML = `
                <div class="provider-item">
                    <div class="provider-status unavailable"></div>
                    <span>No providers available</span>
                </div>
            `;
            return;
        }

        providers.forEach(provider => {
            const item = document.createElement('div');
            item.className = 'provider-item';
            item.innerHTML = `
                <div class="provider-status"></div>
                <span>${this.capitalizeFirst(provider)}</span>
            `;
            
            item.addEventListener('click', () => {
                this.selectProvider(provider);
            });
            
            this.elements.providerList.appendChild(item);
        });

        // Auto-select first provider
        if (!this.activeProvider && providers.length > 0) {
            this.selectProvider(providers[0]);
        }
    }

    selectProvider(provider) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'setProvider',
                provider: provider
            }));
        }
    }

    updateActiveProvider(provider) {
        // Update UI to show active provider
        const items = this.elements.providerList.querySelectorAll('.provider-item');
        items.forEach(item => {
            item.classList.remove('active');
            const providerName = item.querySelector('span').textContent.toLowerCase();
            if (providerName === provider) {
                item.classList.add('active');
            }
        });
    }

    sendTask() {
        const task = this.elements.taskInput.value.trim();
        if (!task || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Add user message
        this.addMessage('user', task);

        // Send to backend
        this.ws.send(JSON.stringify({
            type: 'executeTask',
            task: task
        }));

        // Clear input and disable send button
        this.elements.taskInput.value = '';
        this.elements.sendButton.disabled = true;
        this.autoResizeTextarea();
    }

    addMessage(type, content, metadata = {}) {
        // Remove empty state if it exists
        const emptyState = this.elements.messages.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        
        if (type === 'system' && metadata.taskId) {
            messageEl.innerHTML = `
                <div class="task-status">
                    <div class="loading"></div>
                    ${content}
                </div>
                <div class="task-steps" id="steps-${metadata.taskId}"></div>
            `;
        } else {
            messageEl.textContent = content;
        }
        
        // Add metadata as data attributes
        if (metadata.taskId) {
            messageEl.dataset.taskId = metadata.taskId;
        }
        
        this.elements.messages.appendChild(messageEl);
        this.scrollToBottom();
    }

    updateTaskStatus(taskId, status) {
        const taskMessage = this.elements.messages.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskMessage) return;

        const statusEl = taskMessage.querySelector('.task-status');
        if (statusEl) {
            const statusText = this.getStatusText(status);
            const statusIcon = this.getStatusIcon(status);
            statusEl.innerHTML = `
                ${statusIcon}
                🤖 Task ${status}: ${statusText}
            `;
        }
    }

    updateTaskSteps(taskId, step) {
        const stepsContainer = document.getElementById(`steps-${taskId}`);
        if (!stepsContainer) return;

        const stepEl = document.createElement('div');
        stepEl.className = 'step-item';
        stepEl.innerHTML = `
            <div class="step-status ${step.status}">
                ${step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '●'}
            </div>
            <span>${step.description}</span>
        `;
        
        stepsContainer.appendChild(stepEl);
        this.scrollToBottom();
    }

    updateConnectionStatus(status, text) {
        this.elements.connectionDot.className = `status-dot ${status === 'connected' ? '' : 'disconnected'}`;
        this.elements.connectionStatus.textContent = text;
    }

    updateSendButton() {
        const hasText = this.elements.taskInput.value.trim().length > 0;
        const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;
        const notExecuting = !this.currentTask;
        
        this.elements.sendButton.disabled = !hasText || !isConnected || !notExecuting;
    }

    autoResizeTextarea() {
        const textarea = this.elements.taskInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    getStatusText(status) {
        const statusTexts = {
            'planning': 'analyzing and planning execution',
            'executing': 'running planned steps', 
            'finalizing': 'compiling results',
            'completed': 'finished successfully',
            'failed': 'encountered an error'
        };
        return statusTexts[status] || status;
    }

    getStatusIcon(status) {
        const icons = {
            'planning': '<div class="loading"></div>',
            'executing': '⚡',
            'finalizing': '📊',
            'completed': '✅',
            'failed': '❌'
        };
        return icons[status] || '●';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OpenCoworkApp();
});