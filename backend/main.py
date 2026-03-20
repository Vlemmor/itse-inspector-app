from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
# Import our agent system
from agent_system import app as agent_app

app = FastAPI(title="Licenciatec | LangGraph Backend API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FindingRequest(BaseModel):
    description: str
    role: str
    image_base64: Optional[str] = None

class AnalysisResponse(BaseModel):
    norma: str
    recommendation: str
    risk: str
    ai_supervisor_comment: str

@app.get("/")
async def root():
    return {"status": "online", "version": "2.0.0", "service": "LangGraph Supervisor"}

@app.post("/analyze-finding", response_model=AnalysisResponse)
async def analyze_finding(req: FindingRequest):
    """
    Invokes the LangGraph agent system to analyze an inspection finding.
    """
    try:
        # Prepare state for the graph
        initial_state = {
            "task": f"Analizar hallazgo para rol {req.role}: {req.description}",
            "results": [],
            "current_step": 0
        }
        
        # Invoke the graph
        # Using .invoke instead of .stream for simplicity in the REST response
        final_result = agent_app.invoke(initial_state)
        
        # Map agent results to frontend response
        return AnalysisResponse(
            norma=final_result.get('normative_id') or "RNE Norma G.040",
            recommendation=final_result.get('recommendation') or "Se recomienda corrección inmediata.",
            risk=final_result.get('risk_level') or "medio",
            ai_supervisor_comment="Análisis procesado por el Supervisor IA (LangGraph)."
        )
    except Exception as e:
        print(f"Error in analyze_finding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from vlm_service import analyze_image_with_role

class ImageDescriptionRequest(BaseModel):
    image_base64: str
    role: str

@app.post("/describe-image")
async def describe_image(req: ImageDescriptionRequest):
    """
    Uses Gemini Vision to describe an inspection photo.
    """
    try:
        description = analyze_image_with_role(req.image_base64, req.role)
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
