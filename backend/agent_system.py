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

import json
import os

# --- Helper: Load Normative DB ---
DB_PATH = os.path.join(os.path.dirname(__file__), "normative_db.json")

def peek_norms():
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

# --- Nodes Implementation ---

def inspector_node(state: AgentState):
    """
    Nodo único que clasifica, busca norma y evalúa riesgo.
    Optimizado para minimizar llamadas a LLM y consumo de créditos.
    """
    task_lower = state['task'].lower()
    print(f"--- INSPECTOR IA: Procesando hallazgo ---")
    
    # 1. Clasificación y Búsqueda (Simulación de RAG integrada)
    norms = peek_norms()
    matched_norm = None
    
    # Determinar categoría probable para búsqueda
    category = "arquitectura" # default
    if any(k in task_lower for k in ["eléctrico", "tablero", "cable", "tierra", "térmica"]):
        category = "electrico"
    elif any(k in task_lower for k in ["extintor", "señal", "emergencia"]):
        category = "seguridad"
        
    # Buscar en la DB normativa
    for entry in norms.get(category, []):
        if any(scen in task_lower for scen in entry['scenarios']):
            matched_norm = entry
            break
            
    if matched_norm:
        state['normative_id'] = matched_norm['name']
        state['recommendation'] = matched_norm['recommendation']
    else:
        state['normative_id'] = "RNE (Revisión General)"
        state['recommendation'] = "Se requiere inspección técnica detallada."
        
    # 2. Evaluación de Riesgo (Lógica unificada)
    if any(k in task_lower for k in ["grave", "crítico", "peligro", "fuego", "expuesto"]):
        state['risk_level'] = "alto"
    elif "leve" in task_lower:
        state['risk_level'] = "bajo"
    else:
        state['risk_level'] = "medio"
        
    state['results'].append(f"Análisis procesado: {state['normative_id']}")
    return state

# --- Graph Construction ---

workflow = StateGraph(AgentState)

# Un solo nodo activo para máxima eficiencia
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
