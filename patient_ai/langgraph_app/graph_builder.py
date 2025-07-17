from langgraph.graph import StateGraph, END
from .state import HMAIState
from .nodes.intent_router_node import detect_intent
from .nodes.appointment_booking_node import handle_appointment, handle_booking, handle_sql_info
from tool_nodes.intent_router_tool import insert_appointment_intent
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
graph.add_node("Chat_logger",save_message)


graph.set_entry_point("Intent_detector")
# graph.add_edge("Intent_detector","User_setter")
# graph.add_edge("User_setter","Chat_logger")



graph.add_conditional_edges(
    "Intent_detector",
    lambda state:state.intent,
    {
        "appointment_booking":"Appointment_auto_detail_inserter",
        "sql_query":"Handle_sql",
        "image_analysis":"Image_identifier",
        "pdf_search":"User_PDF_search"
    }
)
graph.add_edge("Appointment_auto_detail_inserter","Handle_booking")

# graph.add_conditional_edges(
#     "Handle_booking",
#     lambda state:"Appointment_auto_detail_inserter" if state.follow_up_required else END,
#     {
#         "Appointment_auto_detail_inserter":"Appointment_auto_detail_inserter",
#         "__end__":END
#     }
# ) 

graph.add_edge("Handle_booking",END)  
graph.add_edge("Image_identifier","Vision_PDF_search")
graph.add_edge("Vision_PDF_search",END)
graph.add_edge("Handle_sql", END)
graph.add_edge("User_PDF_search", END)
# graph.add_edge("User_PDF_search", "AI_setter")
# graph.add_edge("AI_setter",END)

# graph.add_edge("Handle_sql", "AI_setter")
# graph.add_edge("AI_setter",END)

# graph.add_edge("Vision_PDF_search","AI_setter")
# graph.add_edge("AI_setter",END)

patient_graph=graph.compile()

from pprint import pprint

test_state = HMAIState(
    user_input="Book me an appointment for chest pain under Pravin Sisodiya at 11 am day after tomorrow ",
    patient_id=39
)
final_state=patient_graph.invoke(test_state)
print(final_state)
# if (final_state["final_response"]):
#     print(final_state["final_response"])

# else:
#     print(final_state["next_prompt"])

# new_state = HMAIState(**final_state).model_copy(update={
#     "user_input": "10 am",
#     "follow_up_required": False
# })
# completed_state=patient_graph.invoke(new_state)
# print(completed_state)