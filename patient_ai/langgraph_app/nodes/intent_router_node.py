from model_loader import llms
from state import HMAIState

def detect_intent(state:HMAIState)-> str:
    if state.image_base64:
        return"image analysis"
    
    system_prompt=(
        "Classify the user's intent into one of the following:\n"
        "- 'pdf_search' for medical queries\n"
        "- 'image_analysis' for image diagnosis\n"
        "- 'appointment_booking' for booking a doctor\n"
        "- 'sql_query' for sql info"
        "Return only one of the labels."
    )

    user_prompt=f"User_input:${state.user_input}"

    llm=llms["groq_fast"]
    response=llm.predict(system_prompt + "/n" + user_prompt)
    return response.strip()