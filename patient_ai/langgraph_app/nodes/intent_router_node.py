from patient_ai.model_loader import llms, load_config, load_llms
from patient_ai.langgraph_app.state import HMAIState
from patient_ai.langgraph_app.nodes.chat_memory_node import format_conversation_context


def detect_intent(state: HMAIState) -> HMAIState:
    """
    Detect the user's intent from their message, considering conversation context.

    Uses conversation history to better understand follow-up questions and
    maintain context across multi-turn conversations.
    """
    if state.image_base64:
        state.intent = "image_analysis"
        return state

    # Build conversation context from recent messages
    conversation_context = ""
    if state.messages:
        conversation_context = format_conversation_context(
            state.messages, max_messages=5
        )

    # Check if we're in an active booking flow
    booking_context = ""
    if state.booking_stage:
        if state.booking_stage == "choose_doctor":
            booking_context = "CONTEXT: User is currently in an appointment booking flow, selecting a doctor."
        elif state.booking_stage == "choose_slot":
            booking_context = f"CONTEXT: User is currently booking with Dr. {state.selected_doctor}, selecting a time slot."

    system_prompt = f"""You are an intent classifier for a hospital AI assistant.
Your job is to classify the user's message into EXACTLY ONE of the following intents.

INTENTS:
- 'pdf_search': When the user asks for general medical knowledge (diseases, symptoms, treatments, medicines) found in medical literature.
- 'image_analysis': When the user provides or refers to an image for diagnosis.
- 'appointment_booking': When the user explicitly wants to BOOK a new appointment, RESCHEDULE, or CANCEL an existing one. Also use this if user is responding to a booking flow (choosing doctor/time).
- 'sql_query': When the user asks for specific hospital data or personal records. This includes:
  - Asking about available doctors or their schedules
  - Checking appointment history or upcoming appointments
  - Asking about their prescriptions or medications
  - Asking about their admission history or patient details
  - Questions like "when is my next appointment?", "what did the doctor prescribe?", "who is my doctor?"

{booking_context}

RULES:
1. If the user is in a booking flow and provides a name (doctor) or time, classify as 'appointment_booking'
2. If the user asks about THEIR OWN data (appointments, prescriptions, etc.), classify as 'sql_query'
3. If the user asks about general medical facts, classify as 'pdf_search'
4. Return ONLY the intent keyword. Do not return multiple intents."""

    # Include conversation context if available
    user_prompt = ""
    if conversation_context:
        user_prompt = f"""Recent conversation:
{conversation_context}

Current message: {state.user_input}"""
    else:
        user_prompt = f"User message: {state.user_input}"

    load_config()
    load_llms()
    llm = llms["openai"]
    ai_response = llm.invoke(system_prompt + "\n\n" + user_prompt)
    response = ai_response.content

    # Clean and validate response
    cleaned_response = response.strip().lower().replace('"', "").replace("'", "")

    # Handle cases like "pdf_search, appointment_booking" by taking the first one
    if "," in cleaned_response:
        cleaned_response = cleaned_response.split(",")[0].strip()

    # Remove any extra text after the intent
    for valid in ["pdf_search", "image_analysis", "appointment_booking", "sql_query"]:
        if cleaned_response.startswith(valid):
            cleaned_response = valid
            break

    # Fallback for unknown intents
    valid_intents = ["pdf_search", "image_analysis", "appointment_booking", "sql_query"]
    if cleaned_response not in valid_intents:
        print(
            f"Warning: Invalid intent '{cleaned_response}' detected. Defaulting to 'pdf_search'."
        )
        cleaned_response = "pdf_search"

    print(f"DEBUG: Detected intent = {cleaned_response}")
    state.intent = cleaned_response
    return state
