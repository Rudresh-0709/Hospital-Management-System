from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from LLMs.mysqlllm import agent_with_memory
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
    session_id:str

@app.post("/ai")
async def get_ai_response(data:Question):
    answer = agent_with_memory.invoke(
        {"input": data.question},
        config={"configurable": {"session_id": data.session_id}}  # You can make this dynamic if needed
    )
    return {"Answer":answer}