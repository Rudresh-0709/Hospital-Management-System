from langgraph.graph import StateGraph, END
from .state import HMAIState
from .nodes.intent_router_node import detect_intent
from .nodes.appointment_booking_node import handle_appointment, handle_booking, handle_sql_info
from patient_ai.tool_nodes.intent_router_tool import insert_appointment_intent
from .nodes.vision_node import process_image
from .nodes.pdf_node import pdf_search_from_image,pdf_search_from_user
from .nodes.last_sender_node import set_last_sender_ai, set_last_sender_user
from .nodes.final_db_node import save_message

graph = StateGraph(HMAIState)

graph.add_node("Intent_detector",detect_intent)
graph.add_node("Handle_booking",handle_appointment)
graph.add_node("Appointment_auto_detail_inserter",insert_appointment_intent)
graph.add_node("Handle_sql",handle_sql_info)
graph.add_node("Image_identifier",process_image)
graph.add_node("User_PDF_search",pdf_search_from_user)
graph.add_node("Vision_PDF_search",pdf_search_from_image)
graph.add_node("User_setter",set_last_sender_user)
graph.add_node("AI_setter",set_last_sender_ai)
graph.add_node("Chat_logger_User",save_message)
graph.add_node("Chat_logger_AI",save_message)


graph.set_entry_point("User_setter")
graph.add_edge("User_setter","Chat_logger_User")
graph.add_edge("Chat_logger_User","Intent_detector")


def route_after_intent(state: HMAIState) -> str:
    """Route based on booking_stage first, then intent."""
    print(f"DEBUG ROUTING: booking_stage = {state.booking_stage}, intent = {state.intent}")
    # If we're in the middle of a booking flow, skip entity extraction and go directly to booking handler
    if state.booking_stage in ["choose_doctor", "choose_slot"]:
        print(f"DEBUG: Routing to Handle_booking due to booking_stage")
        return "Handle_booking"
    
    # Otherwise route based on intent
    if state.intent == "appointment_booking":
        return "Appointment_auto_detail_inserter"
    elif state.intent == "sql_query":
        return "Handle_sql"
    elif state.intent == "image_analysis":
        return "Image_identifier"
    elif state.intent == "pdf_search":
        return "User_PDF_search"
    else:
        # Default to pdf_search if intent is unclear
        return "User_PDF_search"

graph.add_conditional_edges(
    "Intent_detector",
    route_after_intent,
    {
        "Handle_booking": "Handle_booking",
        "Appointment_auto_detail_inserter": "Appointment_auto_detail_inserter",
        "Handle_sql": "Handle_sql",
        "Image_identifier": "Image_identifier",
        "User_PDF_search": "User_PDF_search"
    }
)
graph.add_edge("Appointment_auto_detail_inserter","Handle_booking")

graph.add_edge("Handle_booking","AI_setter")  
graph.add_edge("Image_identifier","Vision_PDF_search")
graph.add_edge("Vision_PDF_search","AI_setter")
graph.add_edge("Handle_sql", "AI_setter")
graph.add_edge("User_PDF_search", "AI_setter")

graph.add_edge("AI_setter","Chat_logger_AI")
graph.add_edge("Chat_logger_AI",END)

patient_graph=graph.compile()

# Test code - commented out to avoid running on import
# test_state = HMAIState(
#     user_input="I have hurt my spinal cord while riding a bike, i want to book an appointment for that.",
#     patient_id=39
# )
# final_state=patient_graph.invoke(test_state)
# print(final_state)
