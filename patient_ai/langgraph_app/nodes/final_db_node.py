import mysql.connector
from ...tool_nodes.doctor_tool import sql_connector
from ..state import HMAIState

def save_message(state:HMAIState)->HMAIState:
    patient_id=state.patient_id
    message=state.user_input if state.last_sender=="user" else state.final_response
    role=state.last_sender