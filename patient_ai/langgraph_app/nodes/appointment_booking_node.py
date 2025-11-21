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
    # If we're in a booking stage, always handle as booking
    if state.booking_stage in ["choose_doctor", "choose_slot"]:
        return handle_booking(state)
    
    # Otherwise route based on intent
    if state.intent == "appointment_booking":
        return handle_booking(state)
    elif state.intent == "sql_query":
        return handle_sql_info(state)
    return state

def handle_booking(state:HMAIState) -> HMAIState:
    print("Entered handle_booking")
    if state.booking_stage == "choose_doctor" and state.available_doctors:
        user_input_lower = state.user_input.lower().strip()
        for doctor in state.available_doctors:
            if doctor.lower() in user_input_lower or user_input_lower in doctor.lower():
                state.selected_doctor = doctor
                state.booking_stage = None
                # Fetch available slots
                state.available_slots = get_available_slots(doctor)
                if not state.available_slots:
                    state.follow_up_required = True
                    state.next_prompt = f"Sorry, Dr. {doctor} has no available slots."
                    return state
                
                # THIS IS WHERE YOU ADD THE FORMATTING FIX:
                # Format slots as a numbered list
                formatted_slots = "\n".join([f"{i+1}. {slot}" for i, slot in enumerate(state.available_slots)])
                
                state.booking_stage = "choose_slot"
                state.follow_up_required = True
                state.next_prompt = (
                    f"Great! Dr. {doctor} is available at these times:\n\n"
                    + formatted_slots
                    + "\n\nPlease select a slot by typing the date and time."
                )
                return state
        
        # Doctor not found
        state.follow_up_required = True
        state.next_prompt = (
            "I couldn't find that doctor. Please choose from:\n"
            + "\n".join(state.available_doctors)
        )
        return state
        
    if state.diagnosis_condition is None and state.selected_doctor is None:
        state.follow_up_required = True
        state.next_prompt = (
            "Please describe the issue you're facing so I can find the right doctor."
        )
        print(state.next_prompt)
        return state

    # 2. Need doctor?  --------------------------------------------------
    if state.selected_doctor is None:
        print("Entered select doctor ")
        if not state.available_doctors:
            speciality = medical_diagnosis_to_speciality.run(state.diagnosis_condition)
            state.available_doctors = get_specialised_doctors(speciality)

        if not state.available_doctors:
            state.follow_up_required = True

            state.next_prompt = (
                "Sorry, no specialists are available right now. "
                "Would you like to try something else?"
            )
            print(state.next_prompt)
            return state
        state.booking_stage="choose_doctor"
        state.selected_doctor=None
        state.follow_up_required=True
        state.next_prompt=(
            "These doctors are available:\n"
            + "\n".join(str(d) for d in state.available_doctors)
            + "\nPlease select a doctor."
        )
        print(state.next_prompt)

    if (
        state.selected_slot is None
        and state.appointment_date
        and state.appointment_time
        and state.available_slots
    ):
        print("Entered complete if block")
        slot_str = f"{state.appointment_date} at {state.appointment_time}".strip()
        available_slots = [s.strip() for s in state.available_slots]
        print("Trying to match slot_str:", repr(slot_str), "len:", len(slot_str), "bytes:", slot_str.encode())
        for s in available_slots:
            print("Available slot:", repr(s), "len:", len(s), "bytes:", s.encode())
        if slot_str in available_slots:
            print("MATCH FOUND!")
            state.selected_slot = slot_str
        else:
            print("NO MATCH!")

    if state.selected_slot is None and state.booking_stage != "choose_slot":
        print("Entered select slot block")
        if not state.available_slots:
            state.available_slots = get_available_slots(state.selected_doctor)
            if not state.available_slots:
                state.follow_up_required = True
                state.next_prompt = "Sorry can't find a slot"
                return state
            
        if state.appointment_date and state.appointment_time:
            slot_str = f"{state.appointment_date} at {state.appointment_time}".strip().lower()
            normalized_slots = [s.strip().lower() for s in state.available_slots]

            print("Trying to match:", slot_str)
            for i, slot in enumerate(state.available_slots):
                print(f"{i}. Available: {repr(slot)}")

            if slot_str in normalized_slots:
                match_index = normalized_slots.index(slot_str)
                state.selected_slot = state.available_slots[match_index]
                print("MATCH FOUND:", state.selected_slot)
            else:
                print("NO MATCH FOUND for:", slot_str)

        # Only prompt, do NOT reset appointment_time or selected_slot here!
        
        if state.selected_slot is None:
            state.booking_stage = "choose_slot"
            state.follow_up_required = True
            state.next_prompt = (
                "These time-slots are free:\n"
                + "\n".join(state.available_slots)
                + "\nWhich one works for you?"
            )
            return state
    if state.selected_slot:
        date_str, time_str = state.selected_slot.split(" at ")
        state.appointment_date = date_str
        state.appointment_time = time_str
    required = ["appointee_name", "appointee_email", "appointee_contact"]
    missing  = [f for f in required if getattr(state, f, None) is None]

    if missing and state.patient_id:
        patient = get_patient_details(state.patient_id)
        if patient:                      # None -> patient not found
            state.appointee_name    = state.appointee_name    or patient["first_name"]+" "+patient["last_name"]
            state.appointee_email   = state.appointee_email   or patient["email"]
            state.appointee_contact = state.appointee_contact or patient["contact_number"]

            missing  = [f for f in required if getattr(state, f, None) is None]

    if missing:
        state.follow_up_required = True
        state.next_prompt = (
            "I still need your "
            + ", ".join(missing)
            + " to complete the booking."
        )
        print(state.next_prompt)
        return state
    
    date_str, time_str = state.selected_slot.split(" at ")

    insert_appointment(
        name=state.appointee_name,
        contact=state.appointee_contact,
        email=state.appointee_email,
        doctor_name=state.selected_doctor,
        appointment_date=date_str,
        appointment_time=time_str,
        purpose=state.diagnosis_condition,
        status="Scheduled"
    )

    state.final_response=(
        f"Your appointment is booked with Doctor {state.selected_doctor} on {date_str} at {time_str}."
    )
    state.booking_stage=None
    state.follow_up_required=False
    return state

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