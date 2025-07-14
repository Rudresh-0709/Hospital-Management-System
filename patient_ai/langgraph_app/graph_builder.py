from langgraph.graph import StateGraph, END
from .state import HMAIState
from .nodes.intent_router_node import detect_intent
from .nodes.appointment_booking_node import handle_appointment, handle_booking, handle_sql_info
from tool_nodes.intent_router_tool import insert_appointment_intent
from .nodes.vision_node import process_image
from .nodes.pdf_node import pdf_search_from_image,pdf_search_from_user

graph = StateGraph(HMAIState)

graph.add_node("Intent_detector",detect_intent)
graph.add_node("Handle_booking",handle_appointment)
graph.add_node("Appointment_auto_detail_inserter",insert_appointment_intent)
graph.add_node("Handle_sql",handle_sql_info)
graph.add_node("Image_identifier",process_image)
graph.add_node("User_PDF_search",pdf_search_from_user)
graph.add_node("Vision_PDF_search",pdf_search_from_image)


graph.set_entry_point("Intent_detector")

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

graph.add_conditional_edges(
    "Handle_booking",
    lambda state:"Appointment_auto_detail_inserter" if state.follow_up_required else END,
    {
        "Appointment_auto_detail_inserter":"Appointment_auto_detail_inserter",
        "END":END
    }
)   
graph.add_edge("Image_identifier","Vision_PDF_search")
graph.add_edge("User_PDF_search", END)
graph.add_edge("Handle_sql", END)
graph.add_edge("Vision_PDF_search",END)

graph.compile()