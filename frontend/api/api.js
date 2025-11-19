/**
 * API communication layer for Kowka GEN 7
 * Handles all backend communication with enhanced security
 */

class KowkaAPI {
    constructor(baseUrl = 'https://localhost:8443/v1') {
        this.baseUrl = baseUrl;
        this.operatorToken = null;
        this.requestQueue = [];
        this.isProcessingQueue = false;
        
        this.setupInterceptors();
    }
    
    setupInterceptors() {
        // Request interceptor for authentication
        this.requestInterceptor = (config) => {
            if (this.operatorToken) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${this.operatorToken}`;
            }
            
            // Add security headers
            config.headers['X-Kowka-Version'] = '7.0.0';
            config.headers['X-Request-ID'] = this.generateRequestId();
            
            return config;
        };
        
        // Response interceptor for error handling
        this.responseInterceptor = (response) => {
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Authentication required');
            }
            
            if (response.status === 429) {
                this.handleRateLimit(response);
                throw new Error('Rate limit exceeded');
            }
            
            return response;
        };
    }
    
    async request(endpoint, options = {}) {
        const config = this.requestInterceptor({
            url: `${this.baseUrl}${endpoint}`,
            ...options
        });
        
        try {
            const response = await fetch(config.url, {
                method: config.method || 'GET',
                headers: config.headers,
                body: config.body ? JSON.stringify(config.body) : undefined
            });
            
            const processedResponse = this.responseInterceptor(response);
            
            if (!processedResponse.ok) {
                throw new Error(`HTTP ${processedResponse.status}: ${processedResponse.statusText}`);
            }
            
            return await processedResponse.json();
            
        } catch (error) {
            if (error.message.includes('Authentication required')) {
                throw error; // Re-throw auth errors
            }
            
            // Retry logic for transient errors
            if (this.shouldRetry(error)) {
                return this.retryRequest(endpoint, options);
            }
            
            throw error;
        }
    }
    
    async retryRequest(endpoint, options, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
                return await this.request(endpoint, options);
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
            }
        }
    }
    
    shouldRetry(error) {
        const retryableErrors = [
            'Network error',
            'Failed to fetch',
            'ETIMEDOUT',
            'ECONNRESET'
        ];
        
        return retryableErrors.some(retryableError => 
            error.message.includes(retryableError)
        );
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generateRequestId() {
        return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    handleUnauthorized() {
        // Clear token and trigger reauthentication
        this.operatorToken = null;
        sessionStorage.removeItem('kowka_operator_token');
        
        // Dispatch event for app to handle
        window.dispatchEvent(new CustomEvent('kowka:unauthorized'));
    }
    
    handleRateLimit(response) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        console.warn(`Rate limited. Retrying after ${delay}ms`);
        this.delay(delay);
    }
    
    // Specific API methods
    async getSystemStatus() {
        return await this.request('/system/status');
    }
    
    async getActiveAgents() {
        return await this.request('/agents/active');
    }
    
    async getAgentDetails(agentId) {
        return await this.request(`/agents/${agentId}`);
    }
    
    async sendAgentCommand(agentId, command, parameters = {}) {
        return await this.request(`/agents/${agentId}/command`, {
            method: 'POST',
            body: { command, parameters }
        });
    }
    
    async getIntelligenceReport(type, timeframe = '24h') {
        return await this.request(`/intelligence/report/${type}?timeframe=${timeframe}`);
    }
    
    async getFinancialData() {
        return await this.request('/intelligence/financial/report');
    }
    
    async executeDestructionProtocol(agentId, level = 'HIGH') {
        return await this.request(`/agents/${agentId}/destruct/${level}`, {
            method: 'POST'
        });
    }
    
    async getSystemLogs(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await this.request(`/system/logs?${queryParams}`);
    }
    
    async clearSystemLogs() {
        return await this.request('/system/logs/clear', {
            method: 'DELETE'
        });
    }
    
    // Authentication methods
    async authenticate(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            if (!response.ok) {
                throw new Error('Authentication failed');
            }
            
            const data = await response.json();
            this.operatorToken = data.token;
            sessionStorage.setItem('kowka_operator_token', data.token);
            
            return data;
            
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }
    
    logout() {
        this.operatorToken = null;
        sessionStorage.removeItem('kowka_operator_token');
    }
    
    // Utility methods
    setBaseUrl(url) {
        this.baseUrl = url;
    }
    
    setOperatorToken(token) {
        this.operatorToken = token;
    }
}

// Create global API instance
window.kowkaAPI = new KowkaAPI();
