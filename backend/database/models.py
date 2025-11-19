"""
Database models for Kowka GEN 7
"""

from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import logging

Base = declarative_base()

class Agent(Base):
    __tablename__ = 'agents'
    
    agent_id = Column(String(64), primary_key=True)
    registration_date = Column(DateTime, default=datetime.utcnow)
    last_checkin = Column(DateTime)
    system_profile = Column(JSON)
    persistence_methods = Column(JSON)
    risk_level = Column(String(16), default='LOW')
    active = Column(Boolean, default=True)

class IntelligenceData(Base):
    __tablename__ = 'intelligence_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(64))
    data_type = Column(String(32))
    encrypted_data = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    priority = Column(Integer, default=1)

class FinancialRecord(Base):
    __tablename__ = 'financial_records'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(64))
    record_type = Column(String(32))
    platform = Column(String(64))
    credentials = Column(JSON)
    balance = Column(String(32))
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemEvent(Base):
    __tablename__ = 'system_events'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(32))
    severity = Column(String(16))
    description = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

class CryptographicKey(Base):
    __tablename__ = 'crypto_keys'
    
    key_id = Column(String(64), primary_key=True)
    key_type = Column(String(32))
    encrypted_key = Column(Text)
    creation_date = Column(DateTime, default=datetime.utcnow)
    expiration_date = Column(DateTime)
    active = Column(Boolean, default=True)
