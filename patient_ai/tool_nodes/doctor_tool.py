from typing import List, Optional, Dict
from datetime import date, timedelta, datetime
from langchain.tools import tool
import mysql.connector
import os
import yaml

from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_path = os.path.join(base_dir, "config.yaml")

with open(config_path, "r") as file:
    config = yaml.safe_load(file)
    
DB_CONFIG={
    "host":config["database"]["host"],
    "user":config["database"]["user"],
    "password":os.getenv(config["database"]["password"]),
    "database":config["database"]["database"]
}

def sql_connector():
    return mysql.connector.connect(**DB_CONFIG)

from langchain_groq import ChatGroq

def get_all_specialities() -> List[str]:
    conn = sql_connector()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT speciality FROM doctors")
    specialities = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return specialities

# Initialize Groq LLM for speed
groq_api_key = os.getenv(config["llm"]["groq_fast"]["api_key_env"])
llm = ChatGroq(
    model=config["llm"]["groq_fast"]["model_name"],
    api_key=groq_api_key,
    temperature=0.1
)

@tool(description="Given a medical condition or symptom, returns the most appropriate medical specialty.")
def medical_diagnosis_to_speciality(condition:str)->str:
    valid_specialities = get_all_specialities()
    specialities_str = ", ".join([f'"{s}"' for s in valid_specialities])
    
    prompt=f"""
    Given the medical condition: "{condition}", return the most appropriate medical speciality to consult.
    You MUST choose from the following list of valid specialities: [{specialities_str}]
    
    Respond ONLY with the exact name of the speciality from the list. Do not add any other text.
    If none fit perfectly, choose the closest match.
    """
    result=llm.invoke(prompt)
    return result.content.strip().replace('"', '').replace("'", "")

def get_specialised_doctors(speciality:str) -> str:
    print(speciality)
    conn=sql_connector()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT doctor_name FROM doctors WHERE speciality = %s
    """,(speciality,))

    doctors=[doc['doctor_name'] for doc in cursor.fetchall()]
    cursor.close()
    conn.close()
    return doctors

def get_available_slots(doctor_name: str, days_ahead: int = 7, slot_interval_mins: int = 60) -> List[str]:
    conn = sql_connector()
    cursor = conn.cursor(dictionary=True)

    # Step 1: Get doctor's working hours
    cursor.execute("""
        SELECT doctor_in, doctor_out 
        FROM doctors 
        WHERE doctor_name = %s
    """, (doctor_name,))
    result = cursor.fetchone()

    if not result:
        return []

    doctor_in = result['doctor_in']  # e.g., 10:00:00
    doctor_out = result['doctor_out']  # e.g., 16:00:00

    if isinstance(doctor_in, str):
        doctor_in = datetime.strptime(doctor_in, "%H:%M:%S").time()
    elif isinstance(doctor_in, timedelta):  # MySQL `TIME` fields can return timedelta
        doctor_in = (datetime.min + doctor_in).time()

    if isinstance(doctor_out, str):
        doctor_out = datetime.strptime(doctor_out, "%H:%M:%S").time()
    elif isinstance(doctor_out, timedelta):
        doctor_out = (datetime.min + doctor_out).time()

    available_slots = []
    today = date.today()

    for day_offset in range(days_ahead):
        current_date = today + timedelta(days=day_offset)

        # Step 2: Generate all slots between in and out
        slot_time = datetime.combine(current_date, doctor_in)
        end_time = datetime.combine(current_date, doctor_out)

        all_slots_today = []
        while slot_time + timedelta(minutes=slot_interval_mins) <= end_time:
            all_slots_today.append(slot_time.time())
            slot_time += timedelta(minutes=slot_interval_mins)

        # Step 3: Fetch booked slots from appointments table
        cursor.execute("""
            SELECT appointment_time FROM appointments
            WHERE doctor_name = %s AND appointment_date = %s AND status IN ('Scheduled', 'Pending')
        """, (doctor_name, current_date))
        booked_times = [row['appointment_time'] for row in cursor.fetchall()]

        # Step 4: Filter out booked times
        for slot in all_slots_today:
            if slot not in booked_times:
                formatted = f"{current_date.strftime('%Y-%m-%d')} at {slot.strftime('%H:%M')}"
                available_slots.append(formatted)

    cursor.close()
    conn.close()
    return available_slots
