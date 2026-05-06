import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from patient_ai.agent import run_agent

app = FastAPI(title="Hospital AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str
    patient_id: int
    image_base64: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    session_id: str
    patient_id: int


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.patient_id:
        raise HTTPException(status_code=401, detail="patient_id is required")

    try:
        response = await run_agent(
            message=request.message,
            patient_id=request.patient_id,
            session_id=request.session_id,
            image_base64=request.image_base64
        )
        return ChatResponse(
            message=response,
            session_id=request.session_id,
            patient_id=request.patient_id
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}