from model_loader import llms
from langgraph_app.state import HMAIState

def detect_intent(state:HMAIState)-> str:
    if state.image_base64:
        return"image analysis"
    
    system_prompt=(
        "Classify the user's intent into one of the following:\n"
        "- 'pdf_search' for medical queries\n"
        "- 'image_analysis' for image diagnosis\n"
        "- 'appointment_booking' (for booking or managing appointments)\n"
        "- 'sql_query' (for queries about previous or upcoming appointments, medicines, admissions, personal info, etc)"
        "Return only the intent keyword, nothing else"
    )

    user_prompt=f"User_input:${state.user_input}"

    llm=llms["openai"]
    ai_response=llm.invoke(system_prompt + "\n" + user_prompt)
    response=ai_response.content
    return response.strip()
