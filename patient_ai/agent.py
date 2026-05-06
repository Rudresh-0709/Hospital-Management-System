import json
import os
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import StructuredTool
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from pydantic import BaseModel, Field
from typing import Optional

from patient_ai.hospital_mcp.tools.appointments import (
    get_appointments,
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
    get_available_slots,
)
from patient_ai.hospital_mcp.tools.doctors import find_doctors, get_all_specialties
from patient_ai.hospital_mcp.tools.patients import get_prescriptions, get_patient_info, get_admission_history, run_safe_query
from patient_ai.hospital_mcp.tools.knowledge import search_medical_knowledge, analyze_medical_image


# ── Input schemas for StructuredTool ────────────────────────────────────────

class GetAppointmentsInput(BaseModel):
    status: str = Field(default="all", description="all | Scheduled | Completed | Cancelled")

class GetSlotsInput(BaseModel):
    doctor_name: str = Field(description="Exact doctor name from find_doctors results")
    days_ahead: int = Field(default=7)

class BookInput(BaseModel):
    doctor_name: str
    slot: str = Field(description="Exact slot from get_available_slots. Format: YYYY-MM-DD at HH:MM")
    purpose: str

class CancelInput(BaseModel):
    appointment_id: int = Field(description="appointment_id from get_appointments results")

class RescheduleInput(BaseModel):
    appointment_id: int
    new_slot: str = Field(description="Exact slot from get_available_slots. Format: YYYY-MM-DD at HH:MM")

class FindDoctorsInput(BaseModel):
    specialty: Optional[str] = None
    name: Optional[str] = None

class KnowledgeInput(BaseModel):
    query: str

class ImageInput(BaseModel):
    image_base64: str

class EmptyInput(BaseModel):
    pass

class SafeQueryInput(BaseModel):
    user_question: str = Field(description="The patient's question about their medical data")


# ── Tool factory — patient_id is pre-bound, never exposed to the LLM ─────────

def make_tools(patient_id: int) -> list:
    return [
        StructuredTool(
            name="get_appointments",
            description=(
                "Get this patient's appointments. "
                "Filter by status: all, Scheduled, Completed, Cancelled."
            ),
            args_schema=GetAppointmentsInput,
            func=lambda status="all": json.dumps(
                get_appointments(patient_id, status), default=str
            )
        ),
        StructuredTool(
            name="get_available_slots",
            description=(
                "Get open time slots for a doctor. "
                "Always call this before book_appointment. "
                "Returns slots in format 'YYYY-MM-DD at HH:MM'."
            ),
            args_schema=GetSlotsInput,
            func=lambda doctor_name, days_ahead=7: json.dumps(
                get_available_slots(doctor_name, days_ahead)
            )
        ),
        StructuredTool(
            name="book_appointment",
            description=(
                "Book an appointment. "
                "You MUST call get_available_slots first and use an exact slot from those results."
            ),
            args_schema=BookInput,
            func=lambda doctor_name, slot, purpose: json.dumps(
                book_appointment(patient_id, doctor_name, slot, purpose)
            )
        ),
        StructuredTool(
            name="cancel_appointment",
            description=(
                "Cancel an appointment by ID. "
                "Call get_appointments first to get the correct appointment_id."
            ),
            args_schema=CancelInput,
            func=lambda appointment_id: json.dumps(
                cancel_appointment(patient_id, int(appointment_id))
            )
        ),
        StructuredTool(
            name="reschedule_appointment",
            description=(
                "Move an existing appointment to a new slot. "
                "Call get_appointments for the ID, get_available_slots for a valid new slot."
            ),
            args_schema=RescheduleInput,
            func=lambda appointment_id, new_slot: json.dumps(
                reschedule_appointment(patient_id, int(appointment_id), new_slot)
            )
        ),
        StructuredTool(
            name="find_doctors",
            description=(
                "Find doctors by specialty or name. "
                "Call get_all_specialties first if you are unsure what specialties exist."
            ),
            args_schema=FindDoctorsInput,
            func=lambda specialty=None, name=None: json.dumps(
                find_doctors(specialty=specialty, name=name)
            )
        ),
        StructuredTool(
            name="get_all_specialties",
            description="List all medical specialties available in this hospital.",
            args_schema=EmptyInput,
            func=lambda: json.dumps(get_all_specialties())
        ),
        StructuredTool(
            name="get_prescriptions",
            description="Get all prescriptions and medicines for this patient.",
            args_schema=EmptyInput,
            func=lambda: json.dumps(get_prescriptions(patient_id), default=str)
        ),
        StructuredTool(
            name="get_patient_info",
            description="Get this patient's name, email, and contact number.",
            args_schema=EmptyInput,
            func=lambda: json.dumps(get_patient_info(patient_id))
        ),
        StructuredTool(
            name="get_admission_history",
            description="Get this patient's hospital admission history.",
            args_schema=EmptyInput,
            func=lambda: json.dumps(get_admission_history(patient_id), default=str)
        ),
        StructuredTool(
            name="search_medical_knowledge",
            description=(
                "Search medical literature for information about symptoms, "
                "diseases, treatments, and medications."
            ),
            args_schema=KnowledgeInput,
            func=lambda query: search_medical_knowledge(query)
        ),
        StructuredTool(
            name="analyze_medical_image",
            description="Analyze a medical image and return a clinical assessment.",
            args_schema=ImageInput,
            func=lambda image_base64: analyze_medical_image(image_base64)
        ),
        StructuredTool(
            name="run_safe_query",
            description=(
                "Answer any patient question that the other tools don't cover, "
                "by generating and running a safe read-only SQL query against the hospital database. "
                "Use this for questions about blood group, date of birth, diagnosis history, "
                "or any other data not covered by the specific tools above."
            ),
            args_schema=SafeQueryInput,
            func=lambda user_question: json.dumps(
                run_safe_query(patient_id, user_question), default=str
            )
        ),
    ]


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a helpful hospital AI assistant. Today is {today}.

You are speaking with a verified patient. You have secure access to their 
personal medical records and can take actions on their behalf.

TOOL USAGE RULES — follow these exactly:
1. Before booking: always call get_available_slots and use an exact slot string from the results
2. Before cancelling: always call get_appointments to confirm the appointment_id
3. Before rescheduling: call get_appointments for the ID, then get_available_slots for the new slot
4. For conditions/symptoms → find_doctors by specialty. If unsure of specialty, call get_all_specialties first
5. For general medical questions → search_medical_knowledge
6. Never guess appointment IDs, slot times, or doctor names — always look them up first

RESPONSE RULES:
- Be warm, clear, and concise
- When showing appointments or slots, format them as a readable list
- Always confirm with the patient before booking or cancelling
- Add a disclaimer when giving medical information: recommend consulting a doctor
- If a tool returns an error, explain it clearly and suggest next steps"""


# ── Chat history ──────────────────────────────────────────────────────────────

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback to in-memory if no DB URL configured
        from langchain_core.chat_history import InMemoryChatMessageHistory
        return InMemoryChatMessageHistory()
    return SQLChatMessageHistory(
        session_id=session_id,
        connection_string=db_url
    )


# ── Main entry point ──────────────────────────────────────────────────────────

async def run_agent(
    message: str,
    patient_id: int,
    session_id: str,
    image_base64: str = None
) -> str:
    tools = make_tools(patient_id)
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=8,
        handle_parsing_errors=True,
        return_intermediate_steps=False
    )

    agent_with_history = RunnableWithMessageHistory(
        executor,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history"
    )

    # If an image is attached, analyze it first and prepend result to message
    user_input = message
    if image_base64:
        image_result = analyze_medical_image(image_base64)
        user_input = (
            f"{message}\n\n"
            f"[The patient has shared a medical image. Analysis: {image_result}]"
        )

    result = await agent_with_history.ainvoke(
        {
            "input": user_input,
            "today": datetime.now().strftime("%Y-%m-%d")
        },
        config={"configurable": {"session_id": session_id}}
    )

    return result["output"]
