/**
 * Destruction protocols functionality
 */

class DestructionManager {
    constructor(app) {
        this.app = app;
        this.destructionHistory = [];
        this.pendingDestruction = null;
        
        this.initializeDestruction();
    }
    
    initializeDestruction() {
        this.setupEventListeners();
        this.loadDestructionHistory();
        this.loadAgentsForTargeting();
        this.startStatusMonitoring();
    }
    
    setupEventListeners() {
        // Dead man's switch
        document.getElementById('deadmanSwitch')?.addEventListener('change', (e) => {
            this.toggleDeadmanSwitch(e.target.checked);
        });
    }
    
    async loadDestructionHistory() {
        try {
            const history = await this.app.makeApiRequest('/destruction/history');
            this.destructionHistory = history.entries || [];
            this.updateDestructionHistory();
        } catch (error) {
            console.error('Failed to load destruction history:', error);
        }
    }
    
    async loadAgentsForTargeting() {
        try {
            const agents = await this.app.makeApiRequest('/agents/active');
            this.updateAgentSelection(agents.agents || []);
        } catch (error) {
            console.error('Failed to load agents for targeting:', error);
        }
    }
    
    updateAgentSelection(agents) {
        const agentSelect = document.getElementById('agentSelection');
        if (!agentSelect) return;
        
        // Clear existing options except the first one
        while (agentSelect.children.length > 1) {
            agentSelect.removeChild(agentSelect.lastChild);
        }
        
        // Add agent options
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.agent_id;
            option.textContent = `${this.app.maskAgentId(agent.agent_id)} - ${agent.status}`;
            agentSelect.appendChild(option);
        });
    }
    
    updateDestructionHistory() {
        const historyList = document.getElementById('destructionHistory');
        if (!historyList) return;
        
        historyList.innerHTML = this.destructionHistory.map(entry => `
            <div class="history-item">
                <div class="history-time">${this.app.formatTimestamp(entry.timestamp)}</div>
                <div class="history-level level-${entry.level.toLowerCase()}">${entry.level}</div>
                <div class="history-target">${entry.target ? this.app.maskAgentId(entry.target) : 'SYSTEM WIDE'}</div>
                <div class="history-status status-${entry.status.toLowerCase()}">${entry.status}</div>
            </div>
        `).join('');
    }
    
    async initiateProtocol(level, target = null) {
        this.pendingDestruction = { level, target };
        this.showDestructionModal(level, target);
    }
    
    showDestructionModal(level, target) {
        const modal = document.getElementById('destructionModal');
        const title = document.getElementById('modalTitle');
        const warningTitle = document.getElementById('warningTitle');
        const warningDescription = document.getElementById('warningDescription');
        const details = document.getElementById('modalDetails');
        const confirmBtn = document.getElementById('confirmDestructionBtn');
        
        if (!modal || !title) return;
        
        // Set modal content based on destruction level
        const protocolConfig = this.getProtocolConfig(level);
        
        title.textContent = `CONFIRM ${level} DESTRUCTION PROTOCOL`;
        warningTitle.textContent = `${level} DESTRUCTION PROTOCOL`;
        warningDescription.textContent = protocolConfig.warning;
        
        details.innerHTML = `
            <strong>Target:</strong> ${target ? this.app.maskAgentId(target) : 'ALL SYSTEMS'}<br>
            <strong>Actions:</strong><br>
            ${protocolConfig.actions.map(action => `• ${action}`).join('<br>')}
        `;
        
        // Set confirm button style based on level
        confirmBtn.className = 'btn ' + protocolConfig.buttonClass;
        confirmBtn.textContent = `CONFIRM ${level} DESTRUCTION`;
        
        modal.style.display = 'block';
        
        // Clear password field
        document.getElementById('operatorPassword').value = '';
    }
    
    getProtocolConfig(level) {
        const configs = {
            'SANITIZE': {
                warning: 'This will securely delete operational logs and temporary data. Operations may be temporarily disrupted.',
                actions: [
                    'Wipe system logs and temporary files',
                    'Clear recent operational artifacts',
                    'Maintain agent functionality'
                ],
                buttonClass: 'btn-warning'
            },
            'PURGE': {
                warning: 'This will destroy intelligence data and cryptographic materials. Some operations will be permanently terminated.',
                actions: [
                    'Purge intelligence databases',
                    'Destroy cryptographic keys',
                    'Remove persistence mechanisms',
                    'Terminate compromised agents'
                ],
                buttonClass: 'btn-warning'
            },
            'OBLITERATE': {
                warning: 'This will terminate all agents and destroy control infrastructure. Most operations will be permanently lost.',
                actions: [
                    'Terminate all active agents',
                    'Destroy control infrastructure',
                    'Secure wipe storage systems',
                    'Remove all persistence'
                ],
                buttonClass: 'btn-destructive'
            },
            'ARMAGEDDON': {
                warning: 'COMPLETE SYSTEM ANNIHILATION. This action is irreversible and will destroy all data and infrastructure permanently.',
                actions: [
                    'Execute emergency destruct on all systems',
                    'Overwrite all storage with random data',
                    'Destroy cryptographic foundations',
                    'Terminate all network connections',
                    'Irreversible system shutdown'
                ],
                buttonClass: 'btn-armageddon'
            }
        };
        
        return configs[level] || configs['SANITIZE'];
    }
    
    async confirmDestruction() {
        const password = document.getElementById('operatorPassword').value;
        
        if (!password) {
            this.app.showNotification('Operator password required', 'error');
            return;
        }
        
        if (!this.pendingDestruction) {
            this.app.showNotification('No destruction protocol pending', 'error');
            return;
        }
        
        try {
            // Verify operator password
            const authResult = await this.app.makeApiRequest('/auth/verify', {
                method: 'POST',
                body: { password }
            });
            
            if (!authResult.verified) {
                this.app.showNotification('Invalid operator password', 'error');
                return;
            }
            
            // Execute destruction protocol
            const { level, target } = this.pendingDestruction;
            
            let endpoint = '/destruction/execute';
            let body = { level };
            
            if (target) {
                endpoint = `/agents/${target}/destruct/${level.toLowerCase()}`;
            }
            
            const result = await this.app.makeApiRequest(endpoint, {
                method: 'POST',
                body
            });
            
            this.app.showNotification(`${level} protocol initiated successfully`, 'warning');
            this.closeDestructionModal();
            
            // Add to local history
            this.addToHistory(level, target, 'PENDING');
            
            // Refresh history after delay to get final status
            setTimeout(() => {
                this.loadDestructionHistory();
            }, 5000);
            
        } catch (error) {
            console.error('Destruction protocol failed:', error);
            this.app.showNotification('Destruction protocol failed', 'error');
        }
    }
    
    addToHistory(level, target, status) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            target,
            status
        };
        
        this.destructionHistory.unshift(entry);
        
        // Keep only last 50 entries
        if (this.destructionHistory.length > 50) {
            this.destructionHistory = this.destructionHistory.slice(0, 50);
        }
        
        this.updateDestructionHistory();
        this.updateTargetedDestructionLog(level, target, status);
    }
    
    updateTargetedDestructionLog(level, target, status) {
        const log = document.getElementById('targetedDestructionLog');
        if (!log) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">
                ${level} protocol ${status.toLowerCase()} for ${target ? this.app.maskAgentId(target) : 'all systems'}
            </span>
        `;
        
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
    
    async toggleDeadmanSwitch(enabled) {
        try {
            await this.app.makeApiRequest('/destruction/deadman', {
                method: 'POST',
                body: { 
                    enabled,
                    interval: parseInt(document.getElementById('deadmanInterval').value) || 24
                }
            });
            
            const statusElement = document.querySelector('.switch-info .status');
            if (statusElement) {
                statusElement.textContent = enabled ? 'ACTIVE' : 'INACTIVE';
                statusElement.style.color = enabled ? var('--warning-orange') : var('--success-green');
            }
            
            this.app.showNotification(`Dead man's switch ${enabled ? 'activated' : 'deactivated'}`, 'info');
            
        } catch (error) {
            console.error('Failed to toggle dead man switch:', error);
            this.app.showNotification('Failed to configure dead man switch', 'error');
            
            // Revert switch state
            const switchElement = document.getElementById('deadmanSwitch');
            if (switchElement) {
                switchElement.checked = !enabled;
            }
        }
    }
    
    startStatusMonitoring() {
        // WebSocket for real-time destruction status updates
        this.setupDestructionWebSocket();
        
        // Periodic refresh
        setInterval(() => {
            this.loadDestructionHistory();
        }, 30000); // Refresh every 30 seconds
    }
    
    setupDestructionWebSocket() {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/destruction`;
            
            this.destructionWebSocket = new WebSocket(wsUrl);
            
            this.destructionWebSocket.onopen = () => {
                console.log('Destruction WebSocket connected');
            };
            
            this.destructionWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeDestructionUpdate(data);
            };
            
            this.destructionWebSocket.onclose = () => {
                console.log('Destruction WebSocket disconnected');
                setTimeout(() => this.setupDestructionWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('Destruction WebSocket connection failed:', error);
        }
    }
    
    handleRealtimeDestructionUpdate(data) {
        switch (data.type) {
            case 'DESTRUCTION_COMPLETE':
                this.updateDestructionStatus(data.payload);
                break;
            case 'DESTRUCTION_FAILED':
                this.handleDestructionFailure(data.payload);
                break;
            case 'DEADMAN_WARNING':
                this.handleDeadmanWarning(data.payload);
                break;
        }
    }
    
    updateDestructionStatus(update) {
        // Update history entry status
        const historyEntry = this.destructionHistory.find(entry => 
            entry.timestamp === update.timestamp && entry.target === update.target
        );
        
        if (historyEntry) {
            historyEntry.status = update.status;
            this.updateDestructionHistory();
        }
        
        this.app.showNotification(`Destruction protocol ${update.status.toLowerCase()}: ${update.target || 'system wide'}`, 
                                update.status === 'COMPLETED' ? 'success' : 'error');
    }
    
    handleDestructionFailure(failure) {
        this.app.showNotification(`Destruction failed: ${failure.reason}`, 'error');
        
        // Update history
        this.updateDestructionStatus({
            timestamp: failure.timestamp,
            target: failure.target,
            status: 'FAILED'
        });
    }
    
    handleDeadmanWarning(warning) {
        this.app.showNotification(`DEAD MAN SWITCH WARNING: ${warning.message}`, 'error');
    }
}

// Global destruction functions
function initiateSanitizeProtocol() {
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol('SANITIZE');
    }
}

function initiatePurgeProtocol() {
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol('PURGE');
    }
}

function initiateObliterateProtocol() {
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol('OBLITERATE');
    }
}

function initiateArmageddonProtocol() {
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol('ARMAGEDDON');
    }
}

function executeTargetedDestruction() {
    const agentSelect = document.getElementById('agentSelection');
    const levelSelect = document.getElementById('destructionLevel');
    
    if (!agentSelect || !levelSelect) return;
    
    const agentId = agentSelect.value;
    const level = levelSelect.value;
    
    if (!agentId) {
        window.app.showNotification('Please select an agent', 'warning');
        return;
    }
    
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol(level, agentId);
    }
}

function executeEmergencyBroadcast() {
    const levelSelect = document.getElementById('broadcastLevel');
    if (!levelSelect) return;
    
    const level = levelSelect.value;
    
    if (window.destructionManager) {
        window.destructionManager.initiateProtocol(level);
    }
}

function configureDeadmanSwitch() {
    if (window.destructionManager) {
        const switchElement = document.getElementById('deadmanSwitch');
        if (switchElement && switchElement.checked) {
            // Switch is on, just update configuration
            window.destructionManager.toggleDeadmanSwitch(true);
        }
        window.app.showNotification('Dead man switch configuration updated', 'info');
    }
}

function clearDestructionHistory() {
    if (confirm('Clear all destruction history? This action cannot be undone.')) {
        if (window.destructionManager) {
            window.destructionManager.destructionHistory = [];
            window.destructionManager.updateDestructionHistory();
            window.app.showNotification('Destruction history cleared', 'warning');
        }
    }
}

function exportDestructionLogs() {
    if (window.destructionManager) {
        const data = window.destructionManager.destructionHistory;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kowka-destruction-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.app.showNotification('Destruction logs exported successfully', 'success');
    }
}

function closeDestructionModal() {
    const modal = document.getElementById('destructionModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (window.destructionManager) {
        window.destructionManager.pendingDestruction = null;
    }
}

function confirmDestruction() {
    if (window.destructionManager) {
        window.destructionManager.confirmDestruction();
    }
}

// Initialize destruction manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.destructionManager = new DestructionManager(app);
    }
});
