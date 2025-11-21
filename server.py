import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import uuid
from dotenv import load_dotenv

load_dotenv()

# Import the LangGraph app
from patient_ai.langgraph_app.graph_builder import patient_graph
from patient_ai.langgraph_app.state import HMAIState

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
# Key: session_id, Value: HMAIState (dict representation)
sessions: Dict[str, Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str
    patient_id: Optional[int] = None
    image_base64: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        session_id = request.session_id
        
        # Initialize or retrieve state
        if session_id not in sessions:
            print(f"Creating new session: {session_id}")
            # Create initial state
            initial_state = HMAIState(
                user_input=request.message,
                patient_id=request.patient_id,
                image_base64=request.image_base64
            )
            current_state_dict = initial_state.dict()
        else:
            print(f"Resuming session: {session_id}")
            current_state_dict = sessions[session_id]
            
            # Reset per-turn fields that should be fresh for each message
            current_state_dict["user_input"] = request.message
            current_state_dict["image_base64"] = request.image_base64
            current_state_dict["intent"] = None
            current_state_dict["final_response"] = None
            current_state_dict["next_prompt"] = None
            current_state_dict["follow_up_required"] = False
            current_state_dict["last_sender"] = "user"
            
            # Preserve booking context fields:
            # - booking_stage
            # - available_doctors
            # - selected_doctor
            # - available_slots
            # - selected_slot
            # - diagnosis_condition
            # - appointment_date
            # - appointment_time
            # - appointee_name, appointee_email, appointee_contact
            # These are NOT reset, so they carry over from previous turns
            
            # Ensure patient_id is set if provided
            if request.patient_id:
                current_state_dict["patient_id"] = request.patient_id

        # Invoke the graph
        # LangGraph invoke takes the state (dict or object)
        final_state_dict = patient_graph.invoke(current_state_dict)
        
        # Update session store
        sessions[session_id] = final_state_dict
        
        # Determine response
        # If follow_up_required is True, use next_prompt
        # Else use final_response
        
        reply = ""
        if final_state_dict.get("follow_up_required"):
            reply = final_state_dict.get("next_prompt", "I need some more information.")
        else:
            reply = final_state_dict.get("final_response", "I processed your request.")
            
        # Fallback if both are empty (shouldn't happen with correct logic)
        if not reply:
            reply = "I'm not sure how to respond to that."

        return ChatResponse(reply=reply, session_id=session_id)

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
