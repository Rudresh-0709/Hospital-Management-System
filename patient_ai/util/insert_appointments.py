"""
Appointment Insertion Utility

This module handles inserting new appointments into the database.
Patient_id is optional - it can be NULL for walk-in/external patients.
"""

import mysql.connector
from ..tool_nodes.doctor_tool import sql_connector


def check_patient_id_column_exists() -> bool:
    """Check if the appointments table has patient_id column."""
    conn = sql_connector()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'appointments' 
            AND COLUMN_NAME = 'patient_id'
        """
        )
        result = cursor.fetchone()
        return result[0] > 0
    except Exception as e:
        print(f"Error checking for patient_id column: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


def insert_appointment(
    name: str,
    email: str,
    contact: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
    purpose: str,
    status: str = "Scheduled",
    patient_id: int = None,
):
    """
    Insert a new appointment into the database.

    Args:
        name: Patient's name
        email: Patient's email
        contact: Patient's contact number
        doctor_name: Name of the doctor
        appointment_date: Date of appointment (YYYY-MM-DD)
        appointment_time: Time of appointment (HH:MM)
        purpose: Reason for the appointment
        status: Appointment status (default: "Scheduled")
        patient_id: ID of the patient making the appointment (optional - NULL for external patients)

    Returns:
        int: The ID of the newly created appointment, or None on failure
    """
    conn = sql_connector()
    cursor = conn.cursor()

    try:
        # Check if patient_id column exists
        has_patient_id_column = check_patient_id_column_exists()

        if has_patient_id_column:
            # Use the version with patient_id
            cursor.execute(
                """
                INSERT INTO appointments
                (appointee_name, appointee_contact, appointee_email, doctor_name, 
                 appointment_date, appointment_time, purpose, status, patient_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    name,
                    contact,
                    email,
                    doctor_name,
                    appointment_date,
                    appointment_time,
                    purpose,
                    status,
                    patient_id,
                ),
            )
        else:
            # Fallback: Insert without patient_id column
            print(
                "WARNING: appointments table does not have patient_id column. Consider running migration."
            )
            cursor.execute(
                """
                INSERT INTO appointments
                (appointee_name, appointee_contact, appointee_email, doctor_name, 
                 appointment_date, appointment_time, purpose, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    name,
                    contact,
                    email,
                    doctor_name,
                    appointment_date,
                    appointment_time,
                    purpose,
                    status,
                ),
            )

        conn.commit()
        appointment_id = cursor.lastrowid
        print(
            f"DEBUG: Inserted appointment ID {appointment_id} for patient_id {patient_id}"
        )
        return appointment_id

    except mysql.connector.Error as e:
        print(f"Error inserting appointment: {e}")
        conn.rollback()
        return None

    finally:
        cursor.close()
        conn.close()


def check_appointment_conflict(
    doctor_name: str, appointment_date: str, appointment_time: str
) -> bool:
    """
    Check if the requested time slot is already booked.

    Returns:
        bool: True if there's a conflict, False if the slot is available
    """
    conn = sql_connector()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_name = %s 
              AND appointment_date = %s 
              AND appointment_time = %s
              AND status IN ('Scheduled', 'Pending')
        """,
            (doctor_name, appointment_date, appointment_time),
        )

        count = cursor.fetchone()[0]
        return count > 0

    finally:
        cursor.close()
        conn.close()
