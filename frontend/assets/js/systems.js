/**
 * Systems management functionality
 */

class SystemsManager {
    constructor(app) {
        this.app = app;
        this.agents = [];
        this.selectedAgents = new Set();
        this.filters = {
            search: '',
            status: 'ALL'
        };
        
        this.initializeSystems();
    }
    
    initializeSystems() {
        this.setupEventListeners();
        this.loadAgents();
        this.loadSystemStatus();
        this.startAgentMonitoring();
    }
    
    setupEventListeners() {
        // Agent selection
        document.getElementById('selectAllAgents')?.addEventListener('change', (e) => {
            this.toggleSelectAllAgents(e.target.checked);
        });
        
        // Tab functionality
        this.initializeConfigTabs();
    }
    
    async loadAgents() {
        try {
            const agentsData = await this.app.makeApiRequest('/agents/active');
            this.agents = agentsData.agents || [];
            this.updateAgentsTable();
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
    }
    
    async loadSystemStatus() {
        try {
            const status = await this.app.makeApiRequest('/system/components');
            this.updateSystemComponents(status);
        } catch (error) {
            console.error('Failed to load system status:', error);
        }
    }
    
    updateAgentsTable() {
        const tableBody = document.getElementById('agentsTableBody');
        if (!tableBody) return;
        
        const filteredAgents = this.getFilteredAgents();
        
        tableBody.innerHTML = filteredAgents.map(agent => `
            <tr>
                <td>
                    <input type="checkbox" class="agent-checkbox" value="${agent.agent_id}" 
                           ${this.selectedAgents.has(agent.agent_id) ? 'checked' : ''}
                           onchange="toggleAgentSelection('${agent.agent_id}')">
                </td>
                <td>
                    <div class="agent-id">${this.app.maskAgentId(agent.agent_id)}</div>
                </td>
                <td>
                    <span class="agent-status status-${agent.status.toLowerCase()}">
                        ${agent.status}
                    </span>
                </td>
                <td>
                    <div class="last-checkin">${this.app.formatTimestamp(agent.last_checkin)}</div>
                </td>
                <td>
                    <div class="system-profile">
                        <div>OS: ${agent.system_profile?.os || 'Unknown'}</div>
                        <div>Arch: ${agent.system_profile?.architecture || 'Unknown'}</div>
                    </div>
                </td>
                <td>
                    <span class="risk-level risk-${agent.risk_level.toLowerCase()}">
                        ${agent.risk_level}
                    </span>
                </td>
                <td>
                    <div class="agent-actions">
                        <button class="btn btn-secondary btn-xs" onclick="sendAgentCommand('${agent.agent_id}')">COMMAND</button>
                        <button class="btn btn-warning btn-xs" onclick="showAgentDetails('${agent.agent_id}')">DETAILS</button>
                        <button class="btn btn-destructive btn-xs" onclick="initiateDestruction('${agent.agent_id}')">DESTROY</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    getFilteredAgents() {
        return this.agents.filter(agent => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${agent.agent_id} ${agent.system_profile?.os} ${agent.risk_level}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Status filter
            if (this.filters.status !== 'ALL' && agent.status !== this.filters.status) {
                return false;
            }
            
            return true;
        });
    }
    
    updateSystemComponents(status) {
        // Update component cards with real status data
        // This would map the API response to the UI components
        console.log('System components status:', status);
    }
    
    toggleSelectAllAgents(selected) {
        const checkboxes = document.querySelectorAll('.agent-checkbox');
        const agentIds = this.getFilteredAgents().map(agent => agent.agent_id);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
        });
        
        if (selected) {
            agentIds.forEach(id => this.selectedAgents.add(id));
        } else {
            agentIds.forEach(id => this.selectedAgents.delete(id));
        }
        
        this.updateSelectionCount();
    }
    
    toggleAgentSelection(agentId) {
        if (this.selectedAgents.has(agentId)) {
            this.selectedAgents.delete(agentId);
        } else {
            this.selectedAgents.add(agentId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateSelectionCount();
    }
    
    updateSelectAllCheckbox() {
        const selectAll = document.getElementById('selectAllAgents');
        if (!selectAll) return;
        
        const filteredCount = this.getFilteredAgents().length;
        const selectedCount = this.getFilteredAgents().filter(agent => 
            this.selectedAgents.has(agent.agent_id)
        ).length;
        
        selectAll.checked = selectedCount === filteredCount && filteredCount > 0;
        selectAll.indeterminate = selectedCount > 0 && selectedCount < filteredCount;
    }
    
    updateSelectionCount() {
        // Could show selected count in UI if needed
        console.log(`${this.selectedAgents.size} agents selected`);
    }
    
    initializeConfigTabs() {
        // Set first tab as active by default
        this.openConfigTab('network');
    }
    
    openConfigTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        // Remove active class from all buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Activate corresponding button
        const selectedButton = Array.from(tabButtons).find(btn => 
            btn.textContent.toLowerCase().includes(tabName)
        );
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }
    
    startAgentMonitoring() {
        // WebSocket for real-time agent updates
        this.setupAgentWebSocket();
        
        // Periodic refresh
        setInterval(() => {
            this.loadAgents();
            this.loadSystemStatus();
        }, 15000); // Refresh every 15 seconds
    }
    
    setupAgentWebSocket() {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/agents`;
            
            this.agentWebSocket = new WebSocket(wsUrl);
            
            this.agentWebSocket.onopen = () => {
                console.log('Agent WebSocket connected');
            };
            
            this.agentWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeAgentUpdate(data);
            };
            
            this.agentWebSocket.onclose = () => {
                console.log('Agent WebSocket disconnected');
                setTimeout(() => this.setupAgentWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('Agent WebSocket connection failed:', error);
        }
    }
    
    handleRealtimeAgentUpdate(data) {
        switch (data.type) {
            case 'AGENT_CHECKIN':
                this.updateAgentStatus(data.payload);
                break;
            case 'AGENT_COMPROMISED':
                this.handleAgentCompromised(data.payload);
                break;
            case 'AGENT_DESTROYED':
                this.handleAgentDestroyed(data.payload);
                break;
        }
    }
    
    updateAgentStatus(agentData) {
        const existingIndex = this.agents.findIndex(a => a.agent_id === agentData.agent_id);
        
        if (existingIndex >= 0) {
            this.agents[existingIndex] = { ...this.agents[existingIndex], ...agentData };
        } else {
            this.agents.push(agentData);
        }
        
        this.updateAgentsTable();
    }
    
    handleAgentCompromised(agentData) {
        this.app.showNotification(`AGENT COMPROMISED: ${this.app.maskAgentId(agentData.agent_id)}`, 'error');
        
        const existingIndex = this.agents.findIndex(a => a.agent_id === agentData.agent_id);
        if (existingIndex >= 0) {
            this.agents[existingIndex].status = 'COMPROMISED';
            this.agents[existingIndex].risk_level = 'HIGH';
            this.updateAgentsTable();
        }
    }
    
    handleAgentDestroyed(agentData) {
        this.app.showNotification(`Agent destroyed: ${this.app.maskAgentId(agentData.agent_id)}`, 'warning');
        
        this.agents = this.agents.filter(a => a.agent_id !== agentData.agent_id);
        this.selectedAgents.delete(agentData.agent_id);
        this.updateAgentsTable();
    }
    
    searchAgents() {
        const searchInput = document.getElementById('agentSearch');
        if (searchInput) {
            this.filters.search = searchInput.value;
            this.updateAgentsTable();
        }
    }
    
    filterAgents() {
        const statusFilter = document.getElementById('agentStatusFilter');
        if (statusFilter) {
            this.filters.status = statusFilter.value;
            this.updateAgentsTable();
        }
    }
}

// Global systems functions
function deployNewAgent() {
    // Implementation for agent deployment wizard
    window.app.showNotification('Initiating agent deployment wizard', 'info');
}

function searchAgents() {
    if (window.systemsManager) {
        window.systemsManager.searchAgents();
    }
}

function filterAgents() {
    if (window.systemsManager) {
        window.systemsManager.filterAgents();
    }
}

function toggleSelectAllAgents() {
    const selectAll = document.getElementById('selectAllAgents');
    if (selectAll && window.systemsManager) {
        window.systemsManager.toggleSelectAllAgents(selectAll.checked);
    }
}

function toggleAgentSelection(agentId) {
    if (window.systemsManager) {
        window.systemsManager.toggleAgentSelection(agentId);
    }
}

function bulkAgentCommand() {
    if (window.systemsManager) {
        const selectedCount = window.systemsManager.selectedAgents.size;
        if (selectedCount === 0) {
            window.app.showNotification('No agents selected', 'warning');
            return;
        }
        
        // Implementation for bulk command interface
        window.app.showNotification(`Sending command to ${selectedCount} agents`, 'info');
    }
}

function sendAgentCommand(agentId) {
    // Implementation for single agent command interface
    window.app.showNotification(`Sending command to agent: ${agentId}`, 'info');
}

function showAgentDetails(agentId) {
    // Implementation for agent details modal
    window.app.showNotification(`Showing details for agent: ${agentId}`, 'info');
}

function initiateDestruction(agentId) {
    if (confirm(`DESTROY AGENT ${agentId}? This action cannot be undone.`)) {
        window.app.showNotification(`Initiating destruction for agent: ${agentId}`, 'error');
        // Implementation would call destruction API
    }
}

function openConfigTab(tabName) {
    if (window.systemsManager) {
        window.systemsManager.openConfigTab(tabName);
    }
}

function manageCryptoCore() {
    window.app.showNotification('Opening cryptographic core management', 'info');
}

function manageMemoryOps() {
    window.app.showNotification('Opening memory operations management', 'info');
}

function manageNetworkOps() {
    window.app.showNotification('Opening network operations management', 'info');
}

function manageSecurity() {
    window.app.showNotification('Opening security subsystem management', 'info');
}

function saveNetworkConfig() {
    window.app.showNotification('Network configuration saved', 'success');
}

function saveSecurityConfig() {
    window.app.showNotification('Security configuration saved', 'success');
}

// Initialize systems manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.systemsManager = new SystemsManager(app);
    }
});
