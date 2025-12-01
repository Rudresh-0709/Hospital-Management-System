from patient_ai.model_loader import llms, load_config, load_llms
from patient_ai.langgraph_app.state import HMAIState

def detect_intent(state:HMAIState)-> HMAIState:
    if state.image_base64:
        state.intent = "image_analysis"
        return state
    
    system_prompt = (
        "You are an intent classifier for a hospital AI assistant. "
        "Classify the user's message into EXACTLY ONE of the following intents:\n\n"
        "- 'pdf_search': When the user asks for general medical knowledge (diseases, symptoms, treatments, medicines) found in medical literature.\n"
        "- 'image_analysis': When the user provides or refers to an image for diagnosis.\n"
        "- 'appointment_booking': When the user explicitly wants to BOOK a new appointment or RESCHEDULE/CANCEL an existing one.\n"
        "- 'sql_query': When the user asks for specific hospital data or personal records. This includes asking about available doctors, checking if they have an appointment, asking for appointment history/status, admissions, or patient details.\n\n"
        "Return ONLY the intent keyword. Do not return multiple intents."
    )


    user_prompt=f"User_input:${state.user_input}"
    load_config()
    load_llms()
    llm=llms["openai"]
    ai_response=llm.invoke(system_prompt + "\n" + user_prompt)
    response=ai_response.content
    
    # Clean and validate response
    cleaned_response = response.strip().lower().replace('"', '').replace("'", "")
    
    # Handle cases like "pdf_search, appointment_booking" by taking the first one
    if "," in cleaned_response:
        cleaned_response = cleaned_response.split(",")[0].strip()
    
    # Fallback for unknown intents
    valid_intents = ["pdf_search", "image_analysis", "appointment_booking", "sql_query"]
    if cleaned_response not in valid_intents:
        # Default to pdf_search if unsure, or log error. 
        # For now, let's try to fuzzy match or just default to pdf_search as it's the safest "general query" handler
        print(f"Warning: Invalid intent '{cleaned_response}' detected. Defaulting to 'pdf_search'.")
        cleaned_response = "pdf_search"
        
    state.intent = cleaned_response
    return state
