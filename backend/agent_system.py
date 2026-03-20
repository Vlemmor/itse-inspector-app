from typing import Annotated, List, TypedDict, Union, Optional
from langgraph.graph import StateGraph, END

# --- State Definition ---
class AgentState(TypedDict):
    task: str
    plan: Optional[List[str]]
    current_step: int
    results: List[str]
    normative_id: Optional[str]
    recommendation: Optional[str]
    risk_level: Optional[str]
    next_node: str

import os
import json
from dotenv import load_dotenv

load_dotenv()

# --- Helper: Load Normative DB ---
DB_PATH = os.path.join(os.path.dirname(__file__), "normative_db.json")

def peek_norms():
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

import google.generativeai as genai

# Configure genai (assuming it was already configured in vlm_service or we do it here)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def inspector_node(state: AgentState):
    """
    Nodo inteligente que utiliza LLM (Gemini) para analizar el hallazgo.
    Usa la DB normativa como contexto para dar respuestas precisas.
    """
    task_lower = state['task'].lower()
    print(f"--- INSPECTOR IA: Analizando con Gemini ---")
    
    norms = peek_norms()
    norms_context = json.dumps(norms, ensure_ascii=False, indent=2)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Actúa como un inspector técnico senior de ITSE (Seguridad en Edificaciones).
        Analiza el siguiente hallazgo y compáralo con la base de datos normativa adjunta.
        
        HALLAZGO: "{state['task']}"
        
        BASE DE DATOS NORMATIVA:
        {norms_context}
        
        Tu tarea:
        1. Identifica la norma específica (ID y nombre) que aplica. Si no está exactamente en la DB, usa tu conocimiento general sobre el RNE (Reglamento Nacional de Edificaciones de Perú) o CNE.
        2. Proporciona una recomendación técnica clara y accionable.
        3. Determina el nivel de riesgo (bajo, medio, alto).
        
        RESPUESTA EN FORMATO JSON:
        {{
            "normative_id": "ID de la norma",
            "recommendation": "Tu recomendación técnica",
            "risk_level": "bajo|medio|alto"
        }}
        """
        
        response = model.generate_content(prompt)
        # Limpiar respuesta por si el LLM incluye markdown
        json_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(json_text)
        
        state['normative_id'] = data.get('normative_id', 'RNE (Revisión General)')
        state['recommendation'] = data.get('recommendation', 'Se requiere inspección técnica.')
        state['risk_level'] = data.get('risk_level', 'medio')
        
    except Exception as e:
        import traceback
        print(f"--- ERROR CRITICO EN AGENT_SYSTEM ---")
        traceback.print_exc()
        state['normative_id'] = "RNE (Error de Análisis)"
        state['recommendation'] = f"Error: {str(e)[:50]}... Revisar logs del servidor."
        state['risk_level'] = "medio"
        
    state['results'].append(f"Análisis IA: {state['normative_id']}")
    return state

# --- Graph Construction ---

workflow = StateGraph(AgentState)

# Un solo nodo inteligente
workflow.add_node("inspector", inspector_node)

workflow.set_entry_point("inspector")
workflow.add_edge("inspector", END)

# Compile
app = workflow.compile()

if __name__ == "__main__":
    # Test Run
    test_state = {
        "task": "Generar reporte de inspección para extintor vencido",
        "results": [],
        "current_step": 0
    }
    for output in app.stream(test_state):
        print(output)
