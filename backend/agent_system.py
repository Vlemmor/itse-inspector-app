from typing import Annotated, List, TypedDict, Union
from langgraph.graph import StateGraph, END

# --- State Definition ---
class AgentState(TypedDict):
    task: str
    plan: List[str]
    current_step: int
    results: List[str]
    critic_feedback: str
    final_response: str
    next_node: str

# --- Nodes Implementation ---

def supervisor_node(state: AgentState):
    """Decides which path to take based on the task."""
    print("--- SUPERVISOR: Analyzing request ---")
    # Logic to decide if we need a Plan-and-Execute flow or direct response
    if "informe" in state['task'].lower() or "inspección" in state['task'].lower():
        state['next_node'] = "planner"
    else:
        state['next_node'] = "direct_executor"
    return state

def planner_node(state: AgentState):
    """Creates a step-by-step plan."""
    print("--- PLANNER: Creating steps ---")
    # Simulated planning logic
    state['plan'] = [
        "Analizar fotografía del hallazgo",
        "Identificar normativa aplicable en bibliografía",
        "Generar recomendación técnica",
        "Establecer nivel de riesgo"
    ]
    state['current_step'] = 0
    state['results'] = []
    return state

def executor_node(state: AgentState):
    """Executes the current step of the plan."""
    step = state['plan'][state['current_step']]
    print(f"--- EXECUTOR: Running step {state['current_step'] + 1}: {step} ---")
    
    # Simulated execution
    state['results'].append(f"Resultado de: {step}")
    state['current_step'] += 1
    return state

def critic_node(state: AgentState):
    """Evaluates the results before finishing."""
    print("--- CRITIC: Reviewing output ---")
    # logic to check if requirements are met
    if not state['results']:
        state['critic_feedback'] = "Faltan resultados en la ejecución."
        return "replan" # Loop back
    
    state['final_response'] = "\n".join(state['results'])
    return "finish"

# --- Graph Construction ---

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("planner", planner_node)
workflow.add_node("executor", executor_node)
workflow.add_node("critic", critic_node)

# Define Edges
workflow.set_entry_point("supervisor")

workflow.add_conditional_edges(
    "supervisor",
    lambda x: x["next_node"],
    {
        "planner": "planner",
        "direct_executor": "executor" # Placeholder if no plan needed
    }
)

workflow.add_edge("planner", "executor")

# Loop execution until plan is empty
workflow.add_conditional_edges(
    "executor",
    lambda x: "continue" if x["current_step"] < len(x["plan"]) else "critique",
    {
        "continue": "executor",
        "critique": "critic"
    }
)

# Reflection loop
workflow.add_conditional_edges(
    "critic",
    lambda x: x, # Simplifying for internal logic
    {
        "replan": "planner",
        "finish": END
    }
)

# Compile
app = workflow.compile()

if __name__ == "__main__":
    # Test Run
    test_state = {"task": "Generar reporte de inspección para extintor vencido"}
    for output in app.stream(test_state):
        print(output)
