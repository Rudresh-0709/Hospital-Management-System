from ..db import get_connection


def find_doctors(specialty: str = None, name: str = None) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    if specialty:
        cursor.execute(
            "SELECT doctor_name, speciality, doctor_in, doctor_out FROM doctors WHERE speciality = %s",
            (specialty,)
        )
    elif name:
        cursor.execute(
            "SELECT doctor_name, speciality, doctor_in, doctor_out FROM doctors WHERE doctor_name LIKE %s",
            (f"%{name}%",)
        )
    else:
        cursor.execute("SELECT doctor_name, speciality FROM doctors")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in rows:
        if "doctor_in" in row:
            row["doctor_in"] = str(row["doctor_in"])
        if "doctor_out" in row:
            row["doctor_out"] = str(row["doctor_out"])
    return rows


def get_all_specialties() -> list[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT speciality FROM doctors ORDER BY speciality")
    result = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return result

