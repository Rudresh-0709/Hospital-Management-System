from langgraph_app.state import HMAIState
from tool_nodes.doctor_tool import medical_diagnosis_to_speciality, get_available_slots, get_specialised_doctors
from tool_nodes.sql_tool_node import run_sql_query, build_sql_tool, sql_to_nl
from tool_nodes.patient_tool import get_patient_details
from util.insert_appointments import insert_appointment
from langgraph_app.nodes.sql_node import detect_sql_topic


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
    entities = state.extracted_entities or {}
    if not state.diagnosis_condition:
        state.follow_up_required=True
        state.next_prompt="Please descibe the issue you're facing so I can find the right doctor."
        return state
    
    if not state.booking_stage:
        speciality=medical_diagnosis_to_speciality.run(state.diagnosis_condition)
        doctors=get_specialised_doctors(speciality)

        if not doctors:
            state.follow_up_required=True
            state.next_prompt=f"Sorry, no speciality's are available right now. Would you like to try something else ?"
            return state
        
        state.available_doctors=doctors
        state.booking_stage="choose_doctor"
        state.next_prompt="These doctors are available"+doctors
        state.follow_up_required=True
        return state
    if state.booking_stage=="choose_doctor":
        if not state.selected_doctor:
            state.follow_up_required=True
            state.next_prompt="Please select a doctor"
            return state
        slots=get_available_slots(state.selected_doctor)
        state.available_slots=slots
        state.booking_stage="choose_slot"
        state.next_prompt="These are available time slots"+slots
        state.follow_up_required=True
        return state
    
    if state.booling_stage=="choose_slot":
        if not state.selected_slot:
            state.follow_up_required=True
            state.next_prompt="Please select a time slot"
            return state
        
        state.booking_stage="final_check_info"

    required=['appointee_name','appointee_contact','appointee_email','purpose']
    missing=[key for key in required if key not in entities]
    if missing and state.patient_id:
        patient_info=get_patient_details(state.patient_id)
        if patient_info:
            if 'appointee_name' not in entities and 'name' in patient_info:
                entities['appointee_name']=patient_info['name']
            if 'appointee_email' not in entities and 'email' in patient_info:
                entities['appointee_email'] = patient_info['email']
            if 'appointee_contact' not in entities and 'contact' in patient_info:
                entities['appointee_contact'] = patient_info['contact']

            state.patient_details=patient_info

        state.extracted_entities=entities

        missing = [key for key in required if key not in entities]

    if missing:
        state.follow_up_required = True
        state.next_prompt = f"I need your " + ", ".join(missing) + " to complete the booking."
        return state

    date_str, time_str = state.selected_slot.split(" at ")

    # STEP 7: Insert into DB
    insert_appointment(
        doctor_id=state.selected_doctor,
        appointment_date=date_str,
        appointment_time=time_str,
        name=entities['appointee_name'],
        email=entities['appointee_email'],
        contact=entities['appointee_contact'],
        purpose=entities['purpose'],
        status="Scheduled"
    )

    state.final_response=(
        f"Your appointment is booked with Doctor ID {state.selected_doctor} on {date_str} at {time_str}."
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