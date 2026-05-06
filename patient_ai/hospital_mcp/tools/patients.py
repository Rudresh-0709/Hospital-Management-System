from ..db import get_connection


def get_prescriptions(patient_id: int) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.prescription_id, p.prescription_date,
               pm.medicine_name, pm.dosage, pm.time_of_intake
        FROM prescriptions p
        JOIN prescription_medicines pm
          ON p.prescription_id = pm.prescription_id
        WHERE p.patient_id = %s
        ORDER BY p.prescription_date DESC
    """, (patient_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in rows:
        row["prescription_date"] = str(row["prescription_date"])
    return rows


def get_patient_info(patient_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT first_name, last_name, email, contact_number
        FROM patients WHERE patient_id = %s
    """, (patient_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result or {}


def get_admission_history(patient_id: int) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT admit_id, reason_for_admission, doctor_assigned,
               ward_preference, room_number, discharge_date
        FROM admit
        WHERE patient_id = %s
        ORDER BY admit_id DESC
    """, (patient_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in rows:
        if row.get("discharge_date"):
            row["discharge_date"] = str(row["discharge_date"])
    return rows


def run_safe_query(patient_id: int, user_question: str) -> list[dict] | dict:
    from langchain_groq import ChatGroq
    from .schema_context import SCHEMA_CONTEXT
    import os

    # Get patient email for appointments filter
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT email FROM patients WHERE patient_id = %s", (patient_id,)
    )
    patient = cursor.fetchone()
    cursor.close()
    conn.close()

    if not patient:
        return {"error": "Patient not found"}
    patient_email = patient["email"]

    # Build schema context with actual patient values substituted
    schema = SCHEMA_CONTEXT.replace("{patient_id}", str(patient_id))
    schema = schema.replace("{patient_email}", patient_email)

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0
    )

    prompt = f"""You are a MySQL expert for a hospital management system.

{schema}

CURRENT PATIENT:
  patient_id    = {patient_id}
  patient_email = {patient_email}

STRICT RULES:
1. Only write SELECT statements — never INSERT, UPDATE, DELETE, DROP
2. For tables with patient_id column: always add WHERE patient_id = {patient_id}
3. For appointments table: always add WHERE appointee_email = '{patient_email}'
4. Use exact column names from the schema above — do not guess column names
5. Use exact status values shown in the schema — e.g. 'Scheduled' not 'scheduled'
6. If the question cannot be answered from the schema, return exactly: CANNOT_ANSWER

USER QUESTION: {user_question}

Return ONLY the raw SQL query with no markdown, no explanation, no backticks.
If you cannot answer, return only the word CANNOT_ANSWER."""

    response = llm.invoke(prompt)
    sql = response.content.strip().strip("```sql").strip("```").strip()

    # Handle cases the LLM says it can't answer
    if sql == "CANNOT_ANSWER":
        return {"error": "I don't have access to that information in the database."}

    # Validate — must be SELECT
    if not sql.upper().strip().startswith("SELECT"):
        return {"error": "Only SELECT queries are permitted"}

    # Validate — must be scoped to this patient
    if str(patient_id) not in sql and patient_email not in sql:
        return {"error": "Query must be filtered to the current patient"}

    # Execute
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        # Serialize dates and times
        return [
            {k: str(v) if hasattr(v, 'isoformat') else v
             for k, v in row.items()}
            for row in rows
        ]
    except Exception as e:
        return {"error": str(e), "attempted_sql": sql}
