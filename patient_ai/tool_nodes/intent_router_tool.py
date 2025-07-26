import os,re, sys
from copy import deepcopy
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from model_loader import llms, load_llms, load_config
from langgraph_app.state import HMAIState
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from dateutil import parser as dtparser
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser

class BookingIntent(BaseModel):
    doctor_name:Optional[str]=Field(
        description="Preffered doctor for the appointment"
    )
    purpose: Optional[str]=Field(
        description="Reason or symptom for booking the appointment"
    )
    appointment_date:Optional[str]=Field(
        description="Preffered date of appointment."
    )
    appointment_time:Optional[str]=Field(
        description="Preffered time of appointment"
    )

@field_validator("date")
def normalise_date(cls,v):
    if v is None:
        return v
    iso_re = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    if iso_re.match(v):
        return v
    try:
        return dtparser.parse(v, fuzzy=True).date().isoformat()
    except Exception:
        return v

parser = PydanticOutputParser(pydantic_object=BookingIntent)
format_instructions = parser.get_format_instructions()

prompt = PromptTemplate(
    template=(
        "You are an assistant that extracts structured appointment data.\n"
        "Return ONLY valid JSON that obeys these rules:\n"
        "{format_instructions}\n\n"            # ← placeholder, not f-string
        "If the user gives a relative date (e.g. 'tomorrow', 'next Monday'), "
        "convert it to an absolute date in YYYY-MM-DD using today as {today}.\n"
        " The time should be in 24 hours format so you don't have to specify AM or PM\n\n"
        "User says: {user_input}"
    ),
    input_variables=["user_input", "today", "format_instructions"],
)

# either pass it every time …

load_config()
load_llms()
llm=llms["openai"]
def extract_booking_intent(text: str, today: datetime | None = None) -> BookingIntent:
    today = today or datetime.now()
    msg = prompt.format_prompt(
        user_input=text,
        today=today.strftime("%Y-%m-%d"),
        format_instructions=format_instructions
    )   
    response = llm.invoke(msg.to_string())
    raw=response.content if hasattr(response,'content') else str(response)
    return parser.parse(raw)

def insert_appointment_intent(state:HMAIState)->HMAIState:
    intent = extract_booking_intent(state.user_input)

    if intent.purpose:
        state.diagnosis_condition = intent.purpose

    if intent.doctor_name:
        state.selected_doctor = intent.doctor_name

    if intent.appointment_date:
        state.appointment_date = intent.appointment_date

    if intent.appointment_time:
        state.appointment_time = intent.appointment_time

    # Normalize available_slots and slot_str for robust matching
    available_slots = getattr(state, "available_slots", []) or []
    available_slots = [s.strip() for s in available_slots]

    if intent.appointment_date and intent.appointment_time:
        slot_str = f"{intent.appointment_date} at {intent.appointment_time}".strip()
        # Optionally, standardize time format here if needed
        print("Your slot:"+slot_str+"\n")
        for slot in available_slots:
            print(slot)
        if slot_str in available_slots:
            state.selected_slot = slot_str
        else:
            state.selected_slot = None  # Will trigger prompt for available slots

    state.extracted_entities = intent.model_dump(exclude_none=True)
    return state

