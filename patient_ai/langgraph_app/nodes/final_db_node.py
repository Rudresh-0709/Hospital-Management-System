import mysql.connector
from ...tool_nodes.doctor_tool import sql_connector
from ..state import HMAIState

def save_message(state:HMAIState)->HMAIState:
    patient_id=state.patient_id
    user_input