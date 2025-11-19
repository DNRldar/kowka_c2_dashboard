"""
Database operations for Kowka GEN 7
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Agent, IntelligenceData, FinancialRecord, SystemEvent, CryptographicKey

class DatabaseManager:
    """Manages all database operations for Kowka GEN 7"""
    
    def __init__(self, connection_string: str = "sqlite:///kowka_operations.db"):
        self.engine = create_engine(connection_string)
        self.Session = sessionmaker(bind=self.engine)
        self.logger = logging.getLogger('kowka.database')
    
    async def connect(self):
        """Initialize database connection and create tables"""
        try:
            Base.metadata.create_all(self.engine)
            self.logger.info("Database connection established and tables verified")
        except Exception as e:
            self.logger.error(f"Database connection failed: {str(e)}")
            raise
    
    async def store_intelligence(self, agent_id: str, data_type: str, encrypted_data: str):
        """Store intelligence data in database"""
        session = self.Session()
        try:
            intel_record = IntelligenceData(
                agent_id=agent_id,
                data_type=data_type,
                encrypted_data=encrypted_data
            )
            session.add(intel_record)
            session.commit()
            self.logger.debug(f"Intelligence data stored: {data_type} for {agent_id}")
        except Exception as e:
            session.rollback()
            self.logger.error(f"Intelligence storage failed: {str(e)}")
            raise
        finally:
            session.close()
    
    async def purge_agent_data(self, agent_id: str):
        """Purge all data for a specific agent"""
        session = self.Session()
        try:
            # Delete intelligence data
            session.query(IntelligenceData).filter_by(agent_id=agent_id).delete()
            
            # Delete financial records
            session.query(FinancialRecord).filter_by(agent_id=agent_id).delete()
            
            # Deactivate agent
            agent = session.query(Agent).filter_by(agent_id=agent_id).first()
            if agent:
                agent.active = False
            
            session.commit()
            self.logger.info(f"All data purged for agent: {agent_id}")
        except Exception as e:
            session.rollback()
            self.logger.error(f"Agent data purge failed: {str(e)}")
            raise
        finally:
            session.close()
    
    async def log_system_event(self, event_type: str, severity: str, description: str):
        """Log system event for auditing and monitoring"""
        session = self.Session()
        try:
            event = SystemEvent(
                event_type=event_type,
                severity=severity,
                description=description
            )
            session.add(event)
            session.commit()
            self.logger.info(f"System event logged: {event_type} - {severity}")
        except Exception as e:
            session.rollback()
            self.logger.error(f"System event logging failed: {str(e)}")
        finally:
            session.close()
    
    async def disconnect(self):
        """Close database connections"""
        self.engine.dispose()
        self.logger.info("Database connections closed")operations.py
