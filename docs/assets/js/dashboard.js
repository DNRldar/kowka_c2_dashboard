/**
 * Dashboard-specific functionality
 */

class DashboardManager {
    constructor(app) {
        this.app = app;
        this.initializeDashboard();
    }
    
    initializeDashboard() {
        this.setupDashboardEventListeners();
        this.loadDashboardData();
        this.initializeRealTimeUpdates();
    }
    
    setupDashboardEventListeners() {
        // Widget refresh buttons
        document.querySelectorAll('.widget .refresh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.refreshWidget(e.target.closest('.widget'));
            });
        });
        
        // Agent interaction
        document.getElementById('agentsList')?.addEventListener('click', (e) => {
            if (e.target.closest('.agent-item')) {
                this.showAgentDetails(e.target.closest('.agent-item'));
            }
        });
        
        // Alert interactions
        document.getElementById('alertsList')?.addEventListener('click', (e) => {
            if (e.target.closest('.alert-item')) {
                this.handleAlertClick(e.target.closest('.alert-item'));
            }
        });
    }
    
    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadSystemMetrics(),
                this.loadAgentStatistics(),
                this.loadIntelligenceMetrics(),
                this.loadSecurityStatus()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    async loadSystemMetrics() {
        const metrics = await this.app.makeApiRequest('/system/metrics');
        this.updateSystemMetrics(metrics);
    }
    
    async loadAgentStatistics() {
        const agents = await this.app.makeApiRequest('/agents/active');
        this.updateAgentStatistics(agents);
    }
    
    async loadIntelligenceMetrics() {
        const intelligence = await this.app.makeApiRequest('/intelligence/metrics');
        this.updateIntelligenceMetrics(intelligence);
    }
    
    async loadSecurityStatus() {
        const security = await this.app.makeApiRequest('/security/status');
        this.updateSecurityStatus(security);
    }
    
    updateSystemMetrics(metrics) {
        // Update CPU, memory, network usage displays
        const elements = {
            cpuUsage: document.getElementById('cpuUsage'),
            memoryUsage: document.getElementById('memoryUsage'),
            networkUsage: document.getElementById('networkUsage'),
            storageUsage: document.getElementById('storageUsage')
        };
        
        // Update elements with metric data
        Object.keys(elements).forEach(key => {
            if (elements[key] && metrics[key]) {
                elements[key].textContent = metrics[key];
            }
        });
    }
    
    updateAgentStatistics(agents) {
        const stats = this.calculateAgentStatistics(agents);
        
        document.getElementById('activeAgentsCount').textContent = stats.total;
        document.getElementById('highRiskAgents').textContent = stats.highRisk;
        document.getElementById('recentCheckins').textContent = stats.recentCheckins;
    }
    
    calculateAgentStatistics(agents) {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        return {
            total: agents.agents?.length || 0,
            highRisk: agents.agents?.filter(a => a.risk_level === 'HIGH').length || 0,
            recentCheckins: agents.agents?.filter(a => 
                new Date(a.last_checkin) > fiveMinutesAgo
            ).length || 0
        };
    }
    
    updateIntelligenceMetrics(metrics) {
        // Update throughput displays
        const elements = {
            financial: document.getElementById('financialThroughput'),
            keylog: document.getElementById('keylogThroughput'),
            network: document.getElementById('networkThroughput')
        };
        
        if (metrics.throughput) {
            elements.financial.textContent = this.app.formatBytes(metrics.throughput.financial) + '/s';
            elements.keylog.textContent = metrics.throughput.keylog + ' entries/s';
            elements.network.textContent = metrics.throughput.network + ' packets/s';
        }
    }
    
    updateSecurityStatus(security) {
        document.getElementById('securityLevel').textContent = security.level;
        
        const threats = security.threats || {};
        document.getElementById('threatLow').textContent = `LOW: ${threats.low || 0}`;
        document.getElementById('threatMedium').textContent = `MEDIUM: ${threats.medium || 0}`;
        document.getElementById('threatHigh').textContent = `HIGH: ${threats.high || 0}`;
    }
    
    initializeRealTimeUpdates() {
        // WebSocket connection for real-time updates
        this.setupWebSocketConnection();
        
        // Periodic data refresh
        setInterval(() => {
            this.loadDashboardData();
        }, 30000); // Refresh every 30 seconds
    }
    
    setupWebSocketConnection() {
        // Implementation for WebSocket real-time updates
        // This would connect to the backend WebSocket endpoint
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/dashboard`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('Dashboard WebSocket connected');
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeData(data);
            };
            
            this.websocket.onclose = () => {
                console.log('Dashboard WebSocket disconnected');
                // Attempt reconnect after delay
                setTimeout(() => this.setupWebSocketConnection(), 5000);
            };
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }
    
    handleRealtimeData(data) {
        switch (data.type) {
            case 'AGENT_UPDATE':
                this.handleAgentUpdate(data.payload);
                break;
            case 'INTELLIGENCE_UPDATE':
                this.handleIntelligenceUpdate(data.payload);
                break;
            case 'SECURITY_ALERT':
                this.handleSecurityAlert(data.payload);
                break;
            case 'SYSTEM_STATUS':
                this.handleSystemStatusUpdate(data.payload);
                break;
        }
    }
    
    handleAgentUpdate(agentData) {
        // Update specific agent in the display
        this.app.showNotification(`Agent ${this.app.maskAgentId(agentData.agent_id)} updated`, 'info');
        this.loadAgentStatistics(); // Refresh agent data
    }
    
    handleIntelligenceUpdate(intelData) {
        // Update intelligence metrics
        this.updateIntelligenceMetrics(intelData);
    }
    
    handleSecurityAlert(alertData) {
        // Add alert to alerts list
        this.addAlertToList(alertData);
        this.app.showNotification(`Security Alert: ${alertData.message}`, 'error');
    }
    
    handleSystemStatusUpdate(statusData) {
        // Update system status displays
        this.updateSystemMetrics(statusData);
    }
    
    addAlertToList(alert) {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.severity.toLowerCase()}`;
        alertElement.innerHTML = `
            <div class="alert-time">${this.app.formatTimestamp(alert.timestamp)}</div>
            <div class="alert-message">${alert.message}</div>
        `;
        
        // Add to top of list
        alertsList.insertBefore(alertElement, alertsList.firstChild);
        
        // Limit to 10 alerts
        while (alertsList.children.length > 10) {
            alertsList.removeChild(alertsList.lastChild);
        }
    }
    
    refreshWidget(widget) {
        const widgetType = widget.classList[1]; // Assumes second class is widget type
        
        switch (widgetType) {
            case 'system-status-widget':
                this.loadSystemMetrics();
                break;
            case 'agents-widget':
                this.loadAgentStatistics();
                break;
            case 'throughput-widget':
                this.loadIntelligenceMetrics();
                break;
            case 'security-widget':
                this.loadSecurityStatus();
                break;
        }
        
        this.app.showNotification('Widget refreshed', 'info');
    }
    
    showAgentDetails(agentElement) {
        const agentId = agentElement.querySelector('.agent-id').textContent;
        // Implementation would show detailed agent modal
        console.log('Showing details for agent:', agentId);
    }
    
    handleAlertClick(alertElement) {
        const alertMessage = alertElement.querySelector('.alert-message').textContent;
        // Implementation would show alert details
        console.log('Alert clicked:', alertMessage);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.dashboard = new DashboardManager(app);
    }
});

// Global dashboard functions
function refreshDashboard() {
    if (window.dashboard) {
        window.dashboard.loadDashboardData();
    }
}
