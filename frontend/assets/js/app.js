/**
 * Kowka GEN 7 Main Application JavaScript
 * Core functionality and utilities
 */

class KowkaApp {
    constructor() {
        this.apiBaseUrl = 'https://localhost:8443/v1';
        this.operatorToken = null;
        this.autoRefreshIntervals = new Map();
        this.isAuthenticated = false;
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.loadOperatorToken();
        this.setupEventListeners();
        this.updateDateTime();
        this.startBackgroundTasks();
        
        console.log('Kowka GEN 7 Control Center initialized');
    }
    
    loadOperatorToken() {
        // In a real implementation, this would load from secure storage
        this.operatorToken = sessionStorage.getItem('kowka_operator_token');
        this.isAuthenticated = !!this.operatorToken;
        
        if (!this.isAuthenticated) {
            this.showLoginModal();
        }
    }
    
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Before unload
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl + Shift + L - Emergency logout
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            this.emergencyLogout();
        }
        
        // Ctrl + Shift + D - Destruction protocols
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            this.showDestructionModal();
        }
        
        // Ctrl + R - Refresh data (override normal refresh)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            this.refreshAllData();
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseBackgroundTasks();
        } else {
            this.resumeBackgroundTasks();
        }
    }
    
    handleBeforeUnload(e) {
        if (this.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
        
        // Clean up intervals
        this.cleanupBackgroundTasks();
    }
    
    updateDateTime() {
        const updateTime = () => {
            const now = new Date();
            const timeElements = document.querySelectorAll('#currentTime, .time-display');
            
            timeElements.forEach(element => {
                element.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
            });
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    startBackgroundTasks() {
        // Start various background monitoring tasks
        this.autoRefreshIntervals.set('systemStatus', setInterval(() => {
            this.refreshSystemStatus();
        }, 5000));
        
        this.autoRefreshIntervals.set('agentStatus', setInterval(() => {
            this.refreshAgentStatus();
        }, 10000));
        
        this.autoRefreshIntervals.set('securityAlerts', setInterval(() => {
            this.checkSecurityAlerts();
        }, 30000));
    }
    
    pauseBackgroundTasks() {
        this.autoRefreshIntervals.forEach((intervalId, key) => {
            clearInterval(intervalId);
        });
    }
    
    resumeBackgroundTasks() {
        this.startBackgroundTasks();
    }
    
    cleanupBackgroundTasks() {
        this.pauseBackgroundTasks();
        this.autoRefreshIntervals.clear();
    }
    
    async makeApiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.operatorToken}`,
                'Content-Type': 'application/json',
            },
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, requestOptions);
            
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Authentication required');
            }
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showNotification(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    handleUnauthorized() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('kowka_operator_token');
        this.showLoginModal();
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    showLoginModal() {
        // Implementation for login modal
        // This would show a secure authentication interface
        console.log('Showing login modal');
    }
    
    emergencyLogout() {
        if (confirm('EMERGENCY LOGOUT: This will immediately terminate your session. Continue?')) {
            // Clear all sensitive data
            sessionStorage.clear();
            localStorage.clear();
            
            // Redirect to logout page or show login
            this.isAuthenticated = false;
            this.showLoginModal();
            
            this.showNotification('Emergency logout completed', 'warning');
        }
    }
    
    showDestructionModal() {
        // Implementation for destruction protocols modal
        console.log('Showing destruction protocols modal');
    }
    
    refreshAllData() {
        this.refreshSystemStatus();
        this.refreshAgentStatus();
        this.refreshIntelligenceMetrics();
        this.checkSecurityAlerts();
        
        this.showNotification('All data refreshed', 'info');
    }
    
    async refreshSystemStatus() {
        try {
            const status = await this.makeApiRequest('/system/status');
            this.updateSystemStatusDisplay(status);
        } catch (error) {
            console.error('Failed to refresh system status:', error);
        }
    }
    
    async refreshAgentStatus() {
        try {
            const agents = await this.makeApiRequest('/agents/active');
            this.updateAgentsDisplay(agents);
        } catch (error) {
            console.error('Failed to refresh agent status:', error);
        }
    }
    
    async refreshIntelligenceMetrics() {
        // Implementation would fetch and update intelligence metrics
    }
    
    async checkSecurityAlerts() {
        // Implementation would check for security alerts
    }
    
    updateSystemStatusDisplay(status) {
        // Update system status widgets with live data
        const statusElements = {
            'Cryptographic Core': document.querySelector('.status-item:nth-child(1) .status-value'),
            'Memory Operations': document.querySelector('.status-item:nth-child(2) .status-value'),
            'Network Operations': document.querySelector('.status-item:nth-child(3) .status-value'),
            'Intelligence Gathering': document.querySelector('.status-item:nth-child(4) .status-value')
        };
        
        // Update based on actual status data
        // This is a simplified implementation
    }
    
    updateAgentsDisplay(agentsData) {
        const agentsList = document.getElementById('agentsList');
        const agentsCount = document.getElementById('activeAgentsCount');
        
        if (!agentsList || !agentsCount) return;
        
        agentsCount.textContent = agentsData.agents?.length || 0;
        
        // Clear existing list
        agentsList.innerHTML = '';
        
        // Add agent items
        agentsData.agents?.forEach(agent => {
            const agentElement = document.createElement('div');
            agentElement.className = 'agent-item';
            agentElement.innerHTML = `
                <span class="agent-id">${this.maskAgentId(agent.agent_id)}</span>
                <span class="agent-status active">ACTIVE</span>
            `;
            agentsList.appendChild(agentElement);
        });
    }
    
    maskAgentId(agentId) {
        // Mask agent ID for security
        if (agentId.length <= 8) return agentId;
        return agentId.substring(0, 4) + '...' + agentId.substring(agentId.length - 4);
    }
    
    hasUnsavedChanges() {
        // Check if there are unsaved changes in forms
        return false;
    }
    
    // Utility functions
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }
    
    generateUniqueId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
}

// Global utility functions
function deployNewAgent() {
    app.showNotification('Agent deployment initiated', 'info');
    // Implementation would start agent deployment process
}

function initiateNetworkScan() {
    app.showNotification('Network scan initiated', 'info');
    // Implementation would start network scanning
}

function rotateEncryptionKeys() {
    if (confirm('Rotate all encryption keys? This will temporarily disrupt operations.')) {
        app.showNotification('Encryption key rotation initiated', 'warning');
        // Implementation would rotate keys
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KowkaApp();
});
