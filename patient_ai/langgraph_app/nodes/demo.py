from langgraph_app.state import HMAIState
from langgraph_app.nodes.appointment_booking_node import handle_appointment
from langgraph_app.nodes.intent_router_node import detect_intent
from model_loader import load_llms,load_config

load_config()
load_llms()

test_queries = [
    "Are there any appointments under my name?",
    # "What is Dr. Pravin Sisodiya's contact info?",
    # "What is my current reason for admission?",
    # "Show me my admission date and room number.",
    # "What is my email address in your system?"
]

for q in test_queries:
    print(f"\n====================\n👤 User: {q}")
    state = HMAIState(user_input=q, patient_id=39)
    state.intent = detect_intent(state)
    print("Detected intent:", state.intent)  # <-- add this line
    updated_state = handle_appointment(state)
    print("🤖 Response:", updated_state.final_response)