from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HMAIState(BaseModel):
    """
    State object for the Hospital AI Assistant LangGraph.

    This state is passed through all nodes in the graph and maintains
    context across the conversation flow.
    """

    # Pydantic v2 configuration
    model_config = {"arbitrary_types_allowed": True}

    # User input fields
    user_input: Optional[str] = None
    intent: Optional[str] = None
    source: Optional[str] = "text"
    image_base64: Optional[str] = None
    image_path: Optional[str] = None

    # PDF/RAG fields
    pdf_chunks: Optional[List[str]] = None
    pdf_query_input: Optional[str] = None
    vision_result: Optional[str] = None
    booking_result: Optional[str] = None
    final_response: Optional[str] = None
    last_sender: Optional[str] = "user"

    # Patient identification (CRITICAL for privacy)
    patient_id: Optional[int] = None
    session_id: Optional[str] = None

    # Medical context
    last_disease_topic: Optional[str] = None
    diagnosis_condition: Optional[str] = None

    # Appointment scheduling
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None

    # Entity extraction
    extracted_entities: Optional[Dict[str, Any]] = None
    follow_up_required: Optional[bool] = False
    next_prompt: Optional[str] = None

    # Conversation memory (loaded from DB)
    messages: List[Dict] = Field(default_factory=list)
    conversation_context: Optional[str] = (
        None  # Formatted context string for LLM prompts
    )

    # Booking flow state
    booking_stage: Optional[str] = None
    available_doctors: Optional[List[str]] = None
    selected_doctor: Optional[str] = None
    available_slots: Optional[List[str]] = None
    selected_slot: Optional[str] = None

    # SQL query results
    sql_response: Optional[str] = None

    # Appointee details (for booking)
    appointee_name: Optional[str] = None
    appointee_email: Optional[str] = None
    appointee_contact: Optional[int] = None
