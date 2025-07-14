from ..state import HMAIState
from ...tool_nodes.doctor_tool import medical_diagnosis_to_speciality, get_available_slots, get_specialised_doctors
from ...tool_nodes.sql_tool_node import run_sql_query, build_sql_tool, sql_to_nl
from ...tool_nodes.patient_tool import get_patient_details
from ...util.insert_appointments import insert_appointment
from ...langgraph_app.nodes.sql_node import detect_sql_topic
from ...tool_nodes.intent_router_tool import insert_appointment_intent
from copy import deepcopy

TOPIC_TABLE_MAP = {
    "appointments": ["appointments"],
    "doctors": ["doctors"],
    "personal_info": ["patients"],
    "prescriptions": ["prescriptions", "prescription_medicines"],
    "admissions": ["admit", "rooms"]
}


def handle_appointment(state:HMAIState) -> HMAIState:
    if state.intent== "appointment_booking":
        return handle_booking(state)
    elif state.intent == "sql_query":
        return handle_sql_info(state)
    return state

def handle_booking(state:HMAIState) -> HMAIState:
    s=deepcopy(state)

    if s.diagnosis_condition is None:
        s.follow_up_required = True
        s.next_prompt = (
            "Please describe the issue you're facing so I can find the right doctor."
        )
        return s

    # 2. Need doctor?  --------------------------------------------------
    if s.selected_doctor is None:
        if not s.available_doctors:
            speciality = medical_diagnosis_to_speciality.run(s.diagnosis_condition)
            s.available_doctors = get_specialised_doctors(speciality)

        if not s.available_doctors:
            s.follow_up_required = True
            s.next_prompt = (
                "Sorry, no specialists are available right now. "
                "Would you like to try something else?"
            )
            return s
        s.booking_stage="choose_doctor"
        s.follow_up_required=True
        s.next_prompt=(
            "These doctors are available:\n"
            + "\n".join(str(d) for d in s.available_doctors)
            + "\nPlease select a doctor."
        )

    if s.selected_slot is None:
        if not s.available_slots:
            s.available_slots = get_available_slots(s.selected_doctor)

        s.booking_stage = "choose_slot"
        s.follow_up_required = True
        s.next_prompt = (
            "These time-slots are free:\n"
            + "\n".join(s.available_slots)
            + "\nWhich one works for you?"
        )
        return s

    required = ["appointee_name", "appointee_email", "appointee_contact"]
    missing  = [f for f in required if getattr(s, f, None) is None]

    if missing and s.patient_id:
        patient = get_patient_details(s.patient_id)
        if patient:                      # None -> patient not found
            s.appointee_name    = s.appointee_name    or patient["name"]
            s.appointee_email   = s.appointee_email   or patient["email"]
            s.appointee_contact = s.appointee_contact or patient["contact"]

            missing  = [f for f in required if getattr(s, f, None) is None]

    if missing:
        s.follow_up_required = True
        s.next_prompt = (
            "I still need your "
            + ", ".join(missing)
            + " to complete the booking."
        )
        return s
    
    date_str, time_str = s.selected_slot.split(" at ")

    insert_appointment(
        name=s.appointee_name,
        contact=s.appointee_contact,
        email=s.appointee_email,
        doctor_name=s.selected_doctor,
        appointment_date=date_str,
        appointment_time=time_str,
        purpose=s.purpose,
        status="Scheduled"
    )

    s.final_response=(
        f"Your appointment is booked with Doctor {state.selected_doctor} on {date_str} at {time_str}."
    )
    s.booking_stage=None
    s.follow_up_required=False
    return s

def handle_sql_info(state:HMAIState) -> HMAIState:
    print("Entered sql_info")
    user_query = state.user_input
    try:
        topic = detect_sql_topic(user_query)
        print(f"Detected topic: {topic}")
        allowed_tables = TOPIC_TABLE_MAP.get(topic, [])
        print(f"Allowed tables: {allowed_tables}")

        if not allowed_tables:
            state.final_response = "Sorry, I couldn't understand your query topic."
            print(f"Returning early, final_response: {state.final_response}")
            return state

        patient_id=state.patient_id
        sql_tool = build_sql_tool(allowed_tables, patient_id=state.patient_id)
        result = sql_tool.run(user_query)

        user_question=result["query"]
        sql_answer=result["result"]
        state.sql_response = sql_answer

        final_answer=sql_to_nl(user_question, sql_answer)
        state.final_response = str(final_answer) if final_answer else "No data found."
        state.follow_up_required = False
    except Exception as e:
        state.final_response = f"Error accessing database: {str(e)}"
        print(f"SQL handler error: {e}")
        print(f"Set final_response (exception): {state.final_response}")

    state.follow_up_required = False
    print(f"Returning state, final_response: {state.final_response}")
    return state