from typing import List, Optional, Dict
from datetime import date, timedelta, datetime
from langchain.tools import tool
import mysql.connector
import os
import yaml

from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool

with open("config.yaml", "r") as file:
    config = yaml.safe_load(file)

DB_CONFIG={
    "host":config["database"]["host"],
    "user":config["database"]["user"],
    "password":os.getenv(config["database"]["password"]),
    "database":config["database"]["database"]
}

def sql_connector():
    return mysql.connector.connect(**DB_CONFIG)

llm=ChatOpenAI(model=config["llm"]["openai"]["model_name"],temperature=0.1)

@tool(description="Given a medical condition or symptom, returns the most appropriate medical specialty.")
def medical_diagnosis_to_speciality(condition:str)->str:
    prompt=f"""
    Given the medical condition: ${condition}, return the most appropriate medical speciality to consult.
    Respond only with speciality name, like "Cardiologist","Dermatologist","Pulmnologist","Pediatrician",etc."""
    result=llm.invoke(prompt)
    return result.content.strip()

def get_specialised_doctors(speciality:str) -> str:
    conn=sql_connector()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT doctor_name FROM doctors WHERE speciality = %s
    """,(speciality))

    doctors=cursor.fetchall()
    cursor.close()
    conn.close()
    return doctors

def get_available_slots(doctor_id: int, days_ahead: int = 7, slot_interval_mins: int = 60) -> List[str]:
    conn = sql_connector()
    cursor = conn.cursor(dictionary=True)

    # Step 1: Get doctor's working hours
    cursor.execute("""
        SELECT doctor_in, doctor_out 
        FROM doctors 
        WHERE id = %s
    """, (doctor_id,))
    result = cursor.fetchone()

    if not result:
        return []

    doctor_in = result['doctor_in']  # e.g., 10:00:00
    doctor_out = result['doctor_out']  # e.g., 16:00:00

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
            WHERE doctor_id = %s AND appointment_date = %s AND status IN ('Scheduled', 'Pending')
        """, (doctor_id, current_date))
        booked_times = [row['appointment_time'] for row in cursor.fetchall()]

        # Step 4: Filter out booked times
        for slot in all_slots_today:
            if slot not in booked_times:
                formatted = f"{current_date.strftime('%Y-%m-%d')} at {slot.strftime('%H:%M')}"
                available_slots.append(formatted)

    cursor.close()
    conn.close()
    return available_slots
