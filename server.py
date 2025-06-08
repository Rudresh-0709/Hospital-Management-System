from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from LLMs.mysqlllm import ask_ai_question
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

@app.post("/ai")
async def get_ai_response(data:Question):
    answer = ask_ai_question(data.question)
    return {"Answer":answer}