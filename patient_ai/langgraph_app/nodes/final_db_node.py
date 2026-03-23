import mysql.connector
from ...tool_nodes.doctor_tool import sql_connector
from ..state import HMAIState

AI_MEMORY_TABLE = "patient_ai_messages"

def save_message(state:HMAIState)->HMAIState:
    patient_id=state.patient_id
    session_id=state.session_id
    message=state.user_input if state.last_sender=="user" else state.final_response
    role=state.last_sender

    conn = sql_connector()
    cursor = conn.cursor()

    # Dedicated AI memory table prevents overlap with non-AI chat features.
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {AI_MEMORY_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT,
            session_id VARCHAR(255),
            message TEXT,
            role VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute(
        f"""
        INSERT INTO {AI_MEMORY_TABLE} (patient_id, session_id, message, role)
        VALUES (%s, %s, %s, %s)
    """,
        (patient_id, session_id, message, role),
    )

    conn.commit()
    cursor.close()
    conn.close()
    return state