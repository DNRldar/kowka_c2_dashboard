/**
 * Logs page functionality
 */

class LogsManager {
    constructor(app) {
        this.app = app;
        this.logEntries = [];
        this.filters = {
            level: 'ALL',
            search: '',
            autoRefresh: true
        };
        this.autoRefreshInterval = null;
        
        this.initializeLogs();
    }
    
    initializeLogs() {
        this.setupLogEventListeners();
        this.loadLogEntries();
        this.startAutoRefresh();
    }
    
    setupLogEventListeners() {
        // Search input
        document.getElementById('logSearch')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.filterLogs();
        });
        
        // Level filter
        document.getElementById('logLevelFilter')?.addEventListener('change', (e) => {
            this.filters.level = e.target.value;
            this.filterLogs();
        });
        
        // Auto-refresh toggle
        document.getElementById('autoRefresh')?.addEventListener('change', (e) => {
            this.filters.autoRefresh = e.target.checked;
            this.toggleAutoRefresh();
        });
    }
    
    async loadLogEntries() {
        try {
            const logs = await this.app.makeApiRequest('/system/logs');
            this.logEntries = logs.entries || [];
            this.updateLogDisplay();
            this.updateStatistics();
        } catch (error) {
            console.error('Failed to load log entries:', error);
        }
    }
    
    updateLogDisplay() {
        const logEntriesContainer = document.getElementById('logEntries');
        if (!logEntriesContainer) return;
        
        const filteredLogs = this.getFilteredLogs();
        
        logEntriesContainer.innerHTML = filteredLogs.map(log => `
            <div class="log-entry ${log.level.toLowerCase()}">
                <div class="log-column timestamp">${this.formatLogTimestamp(log.timestamp)}</div>
                <div class="log-column level">${log.level}</div>
                <div class="log-column module">${log.module}</div>
                <div class="log-column message">${this.escapeHtml(log.message)}</div>
                <div class="log-column agent">${log.agent_id ? this.app.maskAgentId(log.agent_id) : 'SYSTEM'}</div>
            </div>
        `).join('');
        
        // Scroll to bottom
        logEntriesContainer.scrollTop = logEntriesContainer.scrollHeight;
    }
    
    getFilteredLogs() {
        return this.logEntries.filter(log => {
            // Level filter
            if (this.filters.level !== 'ALL' && log.level !== this.filters.level) {
                return false;
            }
            
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${log.module} ${log.message} ${log.agent_id}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    filterLogs() {
        this.updateLogDisplay();
    }
    
    searchLogs() {
        this.filterLogs();
    }
    
    updateStatistics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const todayLogs = this.logEntries.filter(log => 
            new Date(log.timestamp) >= today
        );
        
        const errors = todayLogs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length;
        const warnings = todayLogs.filter(log => log.level === 'WARNING').length;
        
        document.getElementById('totalLogEntries').textContent = this.logEntries.length;
        document.getElementById('errorCount').textContent = errors;
        document.getElementById('warningCount').textContent = warnings;
        document.getElementById('activeSessions').textContent = '1'; // Would be dynamic
    }
    
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            if (this.filters.autoRefresh) {
                this.loadLogEntries();
            }
        }, 5000); // Refresh every 5 seconds
    }
    
    toggleAutoRefresh() {
        if (this.filters.autoRefresh) {
            this.startAutoRefresh();
        } else {
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }
        }
    }
    
    async exportLogs() {
        try {
            const filteredLogs = this.getFilteredLogs();
            const logText = filteredLogs.map(log => 
                `${log.timestamp} [${log.level}] ${log.module}: ${log.message}`
            ).join('\n');
            
            const blob = new Blob([logText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kowka-logs-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.app.showNotification('Logs exported successfully', 'info');
        } catch (error) {
            console.error('Log export failed:', error);
            this.app.showNotification('Log export failed', 'error');
        }
    }
    
    async clearLogs() {
        if (confirm('Clear all log entries? This action cannot be undone.')) {
            try {
                await this.app.makeApiRequest('/system/logs/clear', { method: 'DELETE' });
                this.logEntries = [];
                this.updateLogDisplay();
                this.updateStatistics();
                this.app.showNotification('Logs cleared successfully', 'warning');
            } catch (error) {
                console.error('Log clearance failed:', error);
                this.app.showNotification('Log clearance failed', 'error');
            }
        }
    }
    
    formatLogTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    refreshLogView() {
        this.updateLogDisplay();
    }
}

// Initialize logs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.logsManager = new LogsManager(app);
    }
});

// Global log functions
function filterLogs() {
    if (window.logsManager) {
        window.logsManager.filterLogs();
    }
}

function searchLogs() {
    if (window.logsManager) {
        window.logsManager.searchLogs();
    }
}

function exportLogs() {
    if (window.logsManager) {
        window.logsManager.exportLogs();
    }
}

function clearLogs() {
    if (window.logsManager) {
        window.logsManager.clearLogs();
    }
}

function toggleAutoRefresh() {
    if (window.logsManager) {
        window.logsManager.toggleAutoRefresh();
    }
}

function refreshLogView() {
    if (window.logsManager) {
        window.logsManager.refreshLogView();
    }
}
