import mysql.connector
from ...tool_nodes.doctor_tool import sql_connector
from ..state import HMAIState

def save_message(state:HMAIState)->HMAIState:
    patient_id=state.patient_id
    message=state.user_input if state.last_sender=="user" else state.final_response
    role=state.last_sender

    conn = sql_connector()
    cursor = conn.cursor()

    # Ensure table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT,
            message TEXT,
            role VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        INSERT INTO chats (patient_id, message, role)
        VALUES (%s, %s, %s)
    """, (patient_id, message, role))

    conn.commit()
    cursor.close()
    conn.close()
    return state