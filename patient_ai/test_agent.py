import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from agent import run_agent

TEST_PATIENT_ID = 39   # change this to a real patient_id in your DB
SESSION_ID = "test-session-001"

tests = [
    "What appointments do I have?",
    "I have knee pain, which doctor should I see?",
    "Book me an appointment with whatever orthopedic doctor is available soonest",
    "What medicines have I been prescribed?",
    "What are the symptoms of diabetes?",
    "What is my blood group?",
]

async def main():
    for message in tests:
        print(f"\n{'='*60}")
        print(f"USER: {message}")
        response = await run_agent(
            message=message,
            patient_id=TEST_PATIENT_ID,
            session_id=SESSION_ID
        )
        print(f"AGENT: {response}")

asyncio.run(main())