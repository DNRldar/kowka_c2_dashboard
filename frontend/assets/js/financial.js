/**
 * Financial intelligence functionality
 */

class FinancialManager {
    constructor(app) {
        this.app = app;
        this.cryptoWallets = [];
        this.bankAccounts = [];
        this.transactions = [];
        this.recoveryQueue = [];
        
        this.filters = {
            cryptoNetwork: 'ALL',
            bankType: 'ALL',
            cryptoSearch: '',
            bankSearch: ''
        };
        
        this.initializeFinancial();
    }
    
    initializeFinancial() {
        this.setupEventListeners();
        this.loadFinancialData();
        this.startRealTimeMonitoring();
    }
    
    setupEventListeners() {
        // Monitoring toggles
        document.getElementById('monitorCrypto')?.addEventListener('change', (e) => {
            this.toggleMonitoring('crypto', e.target.checked);
        });
        
        document.getElementById('monitorBanking')?.addEventListener('change', (e) => {
            this.toggleMonitoring('banking', e.target.checked);
        });
        
        document.getElementById('monitorInvestments')?.addEventListener('change', (e) => {
            this.toggleMonitoring('investments', e.target.checked);
        });
    }
    
    async loadFinancialData() {
        try {
            const [financialData, transactionsData, recoveryData] = await Promise.all([
                this.app.makeApiRequest('/financial/assets'),
                this.app.makeApiRequest('/financial/transactions'),
                this.app.makeApiRequest('/financial/recovery-queue')
            ]);
            
            this.cryptoWallets = financialData.crypto_wallets || [];
            this.bankAccounts = financialData.bank_accounts || [];
            this.transactions = transactionsData.transactions || [];
            this.recoveryQueue = recoveryData.queue || [];
            
            this.updateFinancialDisplays();
            
        } catch (error) {
            console.error('Failed to load financial data:', error);
        }
    }
    
    updateFinancialDisplays() {
        this.updateCryptoWallets();
        this.updateBankAccounts();
        this.updateTransactions();
        this.updateRecoveryQueue();
    }
    
    updateCryptoWallets() {
        const walletsList = document.getElementById('cryptoWalletsList');
        if (!walletsList) return;
        
        const filteredWallets = this.getFilteredCryptoWallets();
        
        walletsList.innerHTML = filteredWallets.map(wallet => `
            <div class="asset-item" onclick="showWalletDetails('${wallet.id}')">
                <div class="asset-header">
                    <span class="asset-type">${wallet.network}</span>
                    <span class="asset-balance">${this.formatCurrency(wallet.balance)}</span>
                </div>
                <div class="asset-details">
                    <div>Address: ${this.truncateAddress(wallet.address)}</div>
                    <div>Type: ${wallet.type}</div>
                </div>
                <div class="asset-address">${wallet.address}</div>
            </div>
        `).join('');
    }
    
    updateBankAccounts() {
        const accountsList = document.getElementById('bankAccountsList');
        if (!accountsList) return;
        
        const filteredAccounts = this.getFilteredBankAccounts();
        
        accountsList.innerHTML = filteredAccounts.map(account => `
            <div class="asset-item" onclick="showAccountDetails('${account.id}')">
                <div class="asset-header">
                    <span class="asset-type">${account.type}</span>
                    <span class="asset-balance">${this.formatCurrency(account.balance)}</span>
                </div>
                <div class="asset-details">
                    <div>Bank: ${account.bank_name}</div>
                    <div>Account: ${account.account_number}</div>
                </div>
                <div class="asset-address">Holder: ${account.holder_name}</div>
            </div>
        `).join('');
    }
    
    updateTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;
        
        transactionsList.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item ${transaction.direction === 'OUTGOING' ? 'transaction-outgoing' : ''}">
                <span class="transaction-type ${transaction.direction === 'INCOMING' ? 'type-incoming' : 'type-outgoing'}">
                    ${transaction.direction}
                </span>
                <span class="transaction-amount">${this.formatCurrency(transaction.amount)}</span>
                <span class="transaction-address">${this.truncateAddress(transaction.address || transaction.account)}</span>
                <span class="transaction-time">${this.app.formatTimestamp(transaction.timestamp)}</span>
                <span class="transaction-status">${transaction.status}</span>
            </div>
        `).join('');
    }
    
    updateRecoveryQueue() {
        const recoveryQueue = document.getElementById('recoveryQueue');
        if (!recoveryQueue) return;
        
        recoveryQueue.innerHTML = this.recoveryQueue.map(operation => `
            <div class="queue-item">
                <div class="queue-info">
                    <span class="queue-asset">${operation.asset_type}: ${this.formatCurrency(operation.amount)}</span>
                    <span class="queue-details">Target: ${operation.target}</span>
                </div>
                <span class="queue-status status-${operation.status.toLowerCase()}">${operation.status}</span>
            </div>
        `).join('');
    }
    
    getFilteredCryptoWallets() {
        return this.cryptoWallets.filter(wallet => {
            // Network filter
            if (this.filters.cryptoNetwork !== 'ALL' && wallet.network !== this.filters.cryptoNetwork) {
                return false;
            }
            
            // Search filter
            if (this.filters.cryptoSearch) {
                const searchTerm = this.filters.cryptoSearch.toLowerCase();
                const searchableText = `${wallet.network} ${wallet.type} ${wallet.address}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    getFilteredBankAccounts() {
        return this.bankAccounts.filter(account => {
            // Type filter
            if (this.filters.bankType !== 'ALL' && account.type !== this.filters.bankType) {
                return false;
            }
            
            // Search filter
            if (this.filters.bankSearch) {
                const searchTerm = this.filters.bankSearch.toLowerCase();
                const searchableText = `${account.bank_name} ${account.type} ${account.holder_name}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    async toggleMonitoring(type, enabled) {
        try {
            await this.app.makeApiRequest('/financial/monitoring/toggle', {
                method: 'POST',
                body: { type, enabled }
            });
            
            this.app.showNotification(`${type} monitoring ${enabled ? 'enabled' : 'disabled'}`, 'info');
        } catch (error) {
            console.error(`Failed to toggle ${type} monitoring:`, error);
            this.app.showNotification(`Failed to toggle ${type} monitoring`, 'error');
            
            // Revert toggle state
            const toggle = document.getElementById(`monitor${type.charAt(0).toUpperCase() + type.slice(1)}`);
            if (toggle) {
                toggle.checked = !enabled;
            }
        }
    }
    
    startRealTimeMonitoring() {
        // WebSocket for real-time financial updates
        this.setupFinancialWebSocket();
        
        // Periodic refresh
        setInterval(() => {
            this.loadFinancialData();
        }, 10000); // Refresh every 10 seconds
    }
    
    setupFinancialWebSocket() {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/financial`;
            
            this.financialWebSocket = new WebSocket(wsUrl);
            
            this.financialWebSocket.onopen = () => {
                console.log('Financial WebSocket connected');
            };
            
            this.financialWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeFinancialData(data);
            };
            
            this.financialWebSocket.onclose = () => {
                console.log('Financial WebSocket disconnected');
                setTimeout(() => this.setupFinancialWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('Financial WebSocket connection failed:', error);
        }
    }
    
    handleRealtimeFinancialData(data) {
        switch (data.type) {
            case 'NEW_TRANSACTION':
                this.addNewTransaction(data.payload);
                break;
            case 'ASSET_DISCOVERED':
                this.addNewAsset(data.payload);
                break;
            case 'RECOVERY_UPDATE':
                this.updateRecoveryOperation(data.payload);
                break;
            case 'BALANCE_UPDATE':
                this.updateAssetBalance(data.payload);
                break;
        }
    }
    
    addNewTransaction(transaction) {
        // Add to beginning of array
        this.transactions.unshift(transaction);
        
        // Keep only last 50 transactions
        if (this.transactions.length > 50) {
            this.transactions = this.transactions.slice(0, 50);
        }
        
        this.updateTransactions();
        
        // Show notification for large transactions
        if (transaction.amount > 10000) {
            this.app.showNotification(`Large transaction: ${this.formatCurrency(transaction.amount)}`, 'warning');
        }
    }
    
    addNewAsset(asset) {
        if (asset.asset_type === 'CRYPTO') {
            this.cryptoWallets.push(asset);
            this.updateCryptoWallets();
        } else if (asset.asset_type === 'BANK') {
            this.bankAccounts.push(asset);
            this.updateBankAccounts();
        }
        
        this.app.showNotification(`New ${asset.asset_type.toLowerCase()} asset discovered`, 'info');
    }
    
    updateRecoveryOperation(operation) {
        const existingIndex = this.recoveryQueue.findIndex(op => op.id === operation.id);
        
        if (existingIndex >= 0) {
            this.recoveryQueue[existingIndex] = operation;
        } else {
            this.recoveryQueue.push(operation);
        }
        
        this.updateRecoveryQueue();
        
        if (operation.status === 'COMPLETED') {
            this.app.showNotification(`Recovery operation completed: ${this.formatCurrency(operation.amount)}`, 'success');
        }
    }
    
    updateAssetBalance(update) {
        if (update.asset_type === 'CRYPTO') {
            const wallet = this.cryptoWallets.find(w => w.id === update.asset_id);
            if (wallet) {
                wallet.balance = update.new_balance;
                this.updateCryptoWallets();
            }
        } else if (update.asset_type === 'BANK') {
            const account = this.bankAccounts.find(a => a.id === update.asset_id);
            if (account) {
                account.balance = update.new_balance;
                this.updateBankAccounts();
            }
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    truncateAddress(address, startChars = 6, endChars = 4) {
        if (address.length <= startChars + endChars) return address;
        return address.substring(0, startChars) + '...' + address.substring(address.length - endChars);
    }
    
    searchCryptoWallets() {
        const searchInput = document.getElementById('cryptoSearch');
        if (searchInput) {
            this.filters.cryptoSearch = searchInput.value;
            this.updateCryptoWallets();
        }
    }
    
    searchBankAccounts() {
        const searchInput = document.getElementById('bankSearch');
        if (searchInput) {
            this.filters.bankSearch = searchInput.value;
            this.updateBankAccounts();
        }
    }
    
    filterCryptoWallets() {
        const networkFilter = document.getElementById('cryptoNetworkFilter');
        if (networkFilter) {
            this.filters.cryptoNetwork = networkFilter.value;
            this.updateCryptoWallets();
        }
    }
    
    filterBankAccounts() {
        const typeFilter = document.getElementById('bankTypeFilter');
        if (typeFilter) {
            this.filters.bankType = typeFilter.value;
            this.updateBankAccounts();
        }
    }
}

// Global financial functions
function initiateAssetRecovery() {
    // Implementation for asset recovery initiation
    window.app.showNotification('Initiating asset recovery operations', 'info');
}

function searchCryptoWallets() {
    if (window.financialManager) {
        window.financialManager.searchCryptoWallets();
    }
}

function searchBankAccounts() {
    if (window.financialManager) {
        window.financialManager.searchBankAccounts();
    }
}

function filterCryptoWallets() {
    if (window.financialManager) {
        window.financialManager.filterCryptoWallets();
    }
}

function filterBankAccounts() {
    if (window.financialManager) {
        window.financialManager.filterBankAccounts();
    }
}

function exportFinancialData() {
    if (window.financialManager) {
        // Implementation for financial data export
        window.app.showNotification('Exporting financial data...', 'info');
        
        // Create and download CSV
        const data = {
            cryptoWallets: window.financialManager.cryptoWallets,
            bankAccounts: window.financialManager.bankAccounts,
            transactions: window.financialManager.transactions
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kowka-financial-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.app.showNotification('Financial data exported successfully', 'success');
    }
}

function showWalletDetails(walletId) {
    // Implementation for wallet details modal
    window.app.showNotification(`Showing details for wallet: ${walletId}`, 'info');
}

function showAccountDetails(accountId) {
    // Implementation for account details modal
    window.app.showNotification(`Showing details for account: ${accountId}`, 'info');
}

// Initialize financial manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof app !== 'undefined') {
        window.financialManager = new FinancialManager(app);
    }
});
