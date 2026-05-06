from datetime import date, timedelta, datetime
from ..db import get_connection


def get_patient_email(patient_id: int) -> str | None:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT email FROM patients WHERE patient_id = %s",
        (patient_id,)
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result["email"] if result else None


def get_appointments(patient_id: int, status: str = "all") -> list[dict]:
    email = get_patient_email(patient_id)
    if not email:
        return []
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    if status == "all":
        cursor.execute("""
            SELECT appointment_id, doctor_name, appointment_date,
                   appointment_time, purpose, status
            FROM appointments
            WHERE appointee_email = %s
            ORDER BY appointment_date DESC
        """, (email,))
    else:
        cursor.execute("""
            SELECT appointment_id, doctor_name, appointment_date,
                   appointment_time, purpose, status
            FROM appointments
            WHERE appointee_email = %s AND status = %s
            ORDER BY appointment_date DESC
        """, (email, status))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in rows:
        row["appointment_date"] = str(row["appointment_date"])
        row["appointment_time"] = str(row["appointment_time"])
    return rows


def book_appointment(
    patient_id: int,
    doctor_name: str,
    slot: str,
    purpose: str
) -> dict:
    try:
        date_str, time_str = slot.split(" at ")
    except ValueError:
        return {"success": False, "error": "Slot format must be 'YYYY-MM-DD at HH:MM'"}

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT first_name, last_name, email, contact_number FROM patients WHERE patient_id = %s",
        (patient_id,)
    )
    patient = cursor.fetchone()
    if not patient:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Patient not found"}

    cursor.execute("""
        SELECT COUNT(*) as cnt FROM appointments
        WHERE doctor_name = %s AND appointment_date = %s
        AND appointment_time = %s AND status IN ('Scheduled', 'Pending')
    """, (doctor_name, date_str, time_str))
    if cursor.fetchone()["cnt"] > 0:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Slot is no longer available"}

    cursor.execute("""
        INSERT INTO appointments
        (appointee_name, appointee_email, appointee_contact,
         doctor_name, appointment_date, appointment_time, purpose, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Scheduled')
    """, (
        f"{patient['first_name']} {patient['last_name']}",
        patient["email"],
        patient["contact_number"],
        doctor_name,
        date_str,
        time_str,
        purpose
    ))
    conn.commit()
    appointment_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {
        "success": True,
        "appointment_id": appointment_id,
        "doctor": doctor_name,
        "date": date_str,
        "time": time_str,
        "purpose": purpose
    }


def cancel_appointment(patient_id: int, appointment_id: int) -> dict:
    email = get_patient_email(patient_id)
    if not email:
        return {"success": False, "error": "Patient not found"}
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT appointment_id, doctor_name, appointment_date, status
        FROM appointments
        WHERE appointment_id = %s AND appointee_email = %s
    """, (appointment_id, email))
    appt = cursor.fetchone()
    if not appt:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Appointment not found or does not belong to you"}
    if appt["status"] == "Cancelled":
        cursor.close()
        conn.close()
        return {"success": False, "error": "Appointment is already cancelled"}
    cursor.execute("""
        UPDATE appointments SET status = 'Cancelled'
        WHERE appointment_id = %s AND appointee_email = %s
    """, (appointment_id, email))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "cancelled_appointment_id": appointment_id}


def reschedule_appointment(
    patient_id: int,
    appointment_id: int,
    new_slot: str
) -> dict:
    try:
        date_str, time_str = new_slot.split(" at ")
    except ValueError:
        return {"success": False, "error": "Slot format must be 'YYYY-MM-DD at HH:MM'"}
    email = get_patient_email(patient_id)
    if not email:
        return {"success": False, "error": "Patient not found"}
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT appointment_id, doctor_name, status
        FROM appointments
        WHERE appointment_id = %s AND appointee_email = %s
    """, (appointment_id, email))
    appt = cursor.fetchone()
    if not appt:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Appointment not found or does not belong to you"}
    if appt["status"] == "Cancelled":
        cursor.close()
        conn.close()
        return {"success": False, "error": "Cannot reschedule a cancelled appointment"}
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM appointments
        WHERE doctor_name = %s AND appointment_date = %s
        AND appointment_time = %s AND status IN ('Scheduled', 'Pending')
        AND appointment_id != %s
    """, (appt["doctor_name"], date_str, time_str, appointment_id))
    if cursor.fetchone()["cnt"] > 0:
        cursor.close()
        conn.close()
        return {"success": False, "error": "New slot is not available"}
    cursor.execute("""
        UPDATE appointments
        SET appointment_date = %s, appointment_time = %s, status = 'Scheduled'
        WHERE appointment_id = %s AND appointee_email = %s
    """, (date_str, time_str, appointment_id, email))
    conn.commit()
    cursor.close()
    conn.close()
    return {
        "success": True,
        "appointment_id": appointment_id,
        "new_date": date_str,
        "new_time": time_str
    }


def get_available_slots(doctor_name: str, days_ahead: int = 7) -> list[str]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT doctor_in, doctor_out FROM doctors WHERE doctor_name = %s",
        (doctor_name,)
    )
    result = cursor.fetchone()
    if not result:
        cursor.close()
        conn.close()
        return []

    doctor_in = result["doctor_in"]
    doctor_out = result["doctor_out"]

    if isinstance(doctor_in, timedelta):
        doctor_in = (datetime.min + doctor_in).time()
    elif isinstance(doctor_in, str):
        doctor_in = datetime.strptime(doctor_in, "%H:%M:%S").time()

    if isinstance(doctor_out, timedelta):
        doctor_out = (datetime.min + doctor_out).time()
    elif isinstance(doctor_out, str):
        doctor_out = datetime.strptime(doctor_out, "%H:%M:%S").time()

    available_slots = []
    today = date.today()

    for day_offset in range(days_ahead):
        current_date = today + timedelta(days=day_offset)
        slot_time = datetime.combine(current_date, doctor_in)
        end_time = datetime.combine(current_date, doctor_out)
        all_slots = []
        while slot_time + timedelta(minutes=60) <= end_time:
            all_slots.append(slot_time.time())
            slot_time += timedelta(minutes=60)

        cursor.execute("""
            SELECT appointment_time FROM appointments
            WHERE doctor_name = %s AND appointment_date = %s
            AND status IN ('Scheduled', 'Pending')
        """, (doctor_name, current_date))
        booked = [row["appointment_time"] for row in cursor.fetchall()]

        for slot in all_slots:
            if slot not in booked:
                available_slots.append(
                    f"{current_date.strftime('%Y-%m-%d')} at {slot.strftime('%H:%M')}"
                )

    cursor.close()
    conn.close()
    return available_slots
