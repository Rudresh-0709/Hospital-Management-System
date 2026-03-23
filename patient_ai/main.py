"""Local CLI runner for the patient AI graph.

This is a developer utility for smoke testing the graph without running FastAPI.
"""

from patient_ai.langgraph_app.graph_builder import patient_graph
from patient_ai.langgraph_app.state import HMAIState


def run_once(message: str, patient_id: int, session_id: str = "local-cli") -> str:
	state = HMAIState(user_input=message, patient_id=patient_id, session_id=session_id)
	result = patient_graph.invoke(state)
	if result.get("follow_up_required"):
		return result.get("next_prompt", "I need more information.")
	return result.get("final_response", "No response generated.")


if __name__ == "__main__":
	pid_raw = input("Patient ID: ").strip()
	patient_id = int(pid_raw) if pid_raw.isdigit() else 0

	while True:
		prompt = input("You: ").strip()
		if not prompt or prompt.lower() in {"exit", "quit"}:
			break
		print(f"AI: {run_once(prompt, patient_id)}")
