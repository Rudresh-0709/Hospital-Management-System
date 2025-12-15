"""
Chat Memory Node - Loads and manages conversation history from MySQL database.

This module provides functions to load recent chat messages for a patient,
enabling the AI to maintain context across conversation turns.
"""

from typing import List, Dict
from ..state import HMAIState
from ...tool_nodes.doctor_tool import sql_connector

MAX_HISTORY_MESSAGES = 10  # Number of recent messages to include in context


def load_chat_history(state: HMAIState) -> HMAIState:
    """
    Load recent chat history from the MySQL 'chats' table for the current patient.

    This function retrieves the most recent messages and populates state.messages
    so that subsequent nodes (intent detection, response generation) can use
    the conversation context.
    """
    if state.patient_id is None:
        state.messages = []
        return state

    try:
        conn = sql_connector()
        cursor = conn.cursor(dictionary=True)

        # Fetch recent messages for this patient, ordered by timestamp
        cursor.execute(
            """
            SELECT message, role, timestamp
            FROM chats
            WHERE patient_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """,
            (state.patient_id, MAX_HISTORY_MESSAGES),
        )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        # Reverse to get chronological order (oldest first)
        rows.reverse()

        # Convert to the expected format
        messages = []
        for row in rows:
            messages.append(
                {
                    "sender": row["role"],
                    "text": row["message"],
                    "timestamp": str(row["timestamp"]) if row["timestamp"] else None,
                }
            )

        state.messages = messages
        print(
            f"DEBUG: Loaded {len(messages)} messages from chat history for patient {state.patient_id}"
        )

    except Exception as e:
        print(f"Error loading chat history: {e}")
        state.messages = []

    return state


def format_conversation_context(messages: List[Dict], max_messages: int = 5) -> str:
    """
    Format recent messages into a string context for LLM prompts.

    Args:
        messages: List of message dicts with 'sender' and 'text' keys
        max_messages: Maximum number of messages to include

    Returns:
        Formatted string with conversation history
    """
    if not messages:
        return ""

    recent = messages[-max_messages:]
    context_parts = []

    for msg in recent:
        sender = msg.get("sender", "user")
        text = msg.get("text", msg.get("message", ""))

        if sender == "user":
            context_parts.append(f"Patient: {text}")
        else:
            context_parts.append(f"Assistant: {text}")

    return "\n".join(context_parts)


def get_conversation_summary(state: HMAIState) -> str:
    """
    Get a brief summary of the current conversation context.

    Returns a formatted string describing:
    - What the patient has been asking about
    - Current booking stage (if any)
    - Any pending actions
    """
    parts = []

    # Check for active booking flow
    if state.booking_stage:
        if state.booking_stage == "choose_doctor":
            parts.append(
                f"Currently booking appointment - waiting for doctor selection"
            )
            if state.available_doctors:
                parts.append(
                    f"Available doctors: {', '.join(state.available_doctors[:3])}"
                )
        elif state.booking_stage == "choose_slot":
            parts.append(
                f"Currently booking with Dr. {state.selected_doctor} - waiting for time slot selection"
            )

    # Check for diagnosis context
    if state.diagnosis_condition:
        parts.append(f"Patient's condition: {state.diagnosis_condition}")

    # Include recent conversation
    if state.messages:
        context = format_conversation_context(state.messages, max_messages=3)
        if context:
            parts.append(f"Recent conversation:\n{context}")

    return "\n".join(parts) if parts else "No prior context."


# Legacy functions for backward compatibility with file-based memory
def save_user_message(state: HMAIState) -> HMAIState:
    """
    Legacy function - messages are now saved by final_db_node.py
    This is kept for backward compatibility but doesn't do anything.
    """
    return state


def load_recent_messages(state: HMAIState, k: int = 10) -> HMAIState:
    """
    Alias for load_chat_history for backward compatibility.
    """
    return load_chat_history(state)


__all__ = [
    "load_chat_history",
    "format_conversation_context",
    "get_conversation_summary",
    "save_user_message",
    "load_recent_messages",
]
