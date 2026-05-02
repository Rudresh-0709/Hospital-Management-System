import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import uuid
import os
import re
import ast
from functools import lru_cache
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from sqlalchemy import create_engine, inspect

load_dotenv()

# Import the LangGraph app
from patient_ai.langgraph_app.graph_builder import patient_graph
from patient_ai.langgraph_app.state import HMAIState

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
# Key: session_id, Value: HMAIState (dict representation)
sessions: Dict[str, Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str
    patient_id: Optional[int] = None
    image_base64: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str


class AdminAiRequest(BaseModel):
    question: str
    session_id: str
    selected_tables: list[str] = []


class AdminAiResponse(BaseModel):
    answer: str
    session_id: str
    selected_tables: list[str] = []


MYSQL_URI = os.getenv("MYSQL_URI")
admin_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
UNAVAILABLE_MSG = "The requested information is not available in the current database schema."

AVAILABLE_AI_TABLES = [
    "patients",
    "admit",
    "appointments",
    "doctors",
    "emergency",
    "equipments",
    "hospital_staff",
    "nurses",
    "rooms",
    "visits",
    "diagnosis",
    "prescription_medicines",
]

TABLE_KEYWORD_HINTS = {
    "admit": ["admit", "admission", "admitted", "ward", "discharge", "room"],
    "appointments": ["appointment", "appointments", "schedule", "slot", "booking"],
    "patients": ["patient", "patients", "name", "age", "dob", "gender"],
    "doctors": ["doctor", "doctors", "consultant", "specialist"],
    "nurses": ["nurse", "nurses"],
    "hospital_staff": ["staff", "employee", "employees"],
    "rooms": ["room", "rooms", "bed", "beds", "icu"],
    "visits": ["visit", "visits", "visited", "followup"],
    "diagnosis": ["diagnosis", "diagnose", "condition", "symptom"],
    "prescription_medicines": ["prescription", "medicine", "medication", "drug"],
    "emergency": ["emergency", "critical", "urgent"],
    "equipments": ["equipment", "equipments", "device", "devices", "machine"],
}


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9_]+", (text or "").lower()))


@lru_cache(maxsize=1)
def get_available_table_columns() -> Dict[str, list[str]]:
    if not MYSQL_URI:
        return {}

    try:
        engine = create_engine(MYSQL_URI)
        inspector = inspect(engine)
        table_columns: Dict[str, list[str]] = {}
        for table in AVAILABLE_AI_TABLES:
            if inspector.has_table(table):
                cols = [c.get("name", "") for c in inspector.get_columns(table)]
                table_columns[table] = [c for c in cols if c]
        return table_columns
    except Exception as e:
        print(f"Admin AI table metadata loading error: {e}")
        return {}


def infer_tables_from_question(question: str, max_tables: int = 4) -> list[str]:
    metadata = get_available_table_columns()
    if not metadata:
        return ["patients"]

    q = (question or "").lower()
    q_tokens = _tokenize(q)
    scored: list[tuple[float, str]] = []

    for table, columns in metadata.items():
        score = 0.0

        # Table name mention
        table_tokens = _tokenize(table.replace("_", " "))
        if table in q:
            score += 5.0
        score += 1.0 * len(table_tokens.intersection(q_tokens))

        # Domain keyword hints
        for hint in TABLE_KEYWORD_HINTS.get(table, []):
            if hint in q:
                score += 1.5

        # Column mention and token overlap
        for col in columns:
            col_l = col.lower()
            if col_l in q:
                score += 3.0
            col_tokens = _tokenize(col_l.replace("_", " "))
            score += 0.5 * len(col_tokens.intersection(q_tokens))

        if score > 0:
            scored.append((score, table))

    scored.sort(key=lambda x: x[0], reverse=True)
    inferred = [t for _, t in scored[:max_tables]]
    return inferred or ["patients"]


def rewrite_limit_in_subquery(sql_stmt: str) -> Optional[str]:
    """Rewrite MySQL-incompatible `LIMIT` within `IN (subquery)` into JOIN + derived table."""
    pattern = re.compile(
        r"""
        ^\s*select\s+(?P<select_part>.*?)\s+
        from\s+(?P<main_table>[a-zA-Z0-9_]+)
        (?:\s+(?P<main_alias>[a-zA-Z0-9_]+))?\s+
        where\s+(?P<left_col>[a-zA-Z0-9_\.]+)\s+in\s*\(\s*
        select\s+(?P<sub_col>[a-zA-Z0-9_\.]+)\s+
        from\s+(?P<sub_table>[a-zA-Z0-9_]+)
        (?P<sub_rest>.*?)\s+limit\s+(?P<limit_num>\d+)\s*
        \)\s*;?\s*$
        """,
        re.IGNORECASE | re.DOTALL | re.VERBOSE,
    )
    match = pattern.match(sql_stmt or "")
    if not match:
        return None

    select_part = match.group("select_part").strip()
    main_table = match.group("main_table").strip()
    main_alias = (match.group("main_alias") or "").strip()
    left_col = match.group("left_col").strip()
    sub_col = match.group("sub_col").strip()
    sub_table = match.group("sub_table").strip()
    sub_rest = match.group("sub_rest").rstrip()
    limit_num = match.group("limit_num").strip()

    derived_sub_col = sub_col.split(".")[-1]
    if "." not in left_col:
        left_expr = f"{main_alias}.{left_col}" if main_alias else f"{main_table}.{left_col}"
    else:
        left_expr = left_col

    from_expr = f"{main_table} {main_alias}".strip()
    rewritten = (
        f"SELECT {select_part}\n"
        f"FROM {from_expr}\n"
        f"JOIN (\n"
        f"    SELECT {sub_col}\n"
        f"    FROM {sub_table}{sub_rest}\n"
        f"    LIMIT {limit_num}\n"
        f") AS _lim ON {left_expr} = _lim.{derived_sub_col}"
    )
    return rewritten


def is_admitted_patients_question(question: str) -> bool:
    q = (question or "").lower()
    return (
        ("admitted" in q or "admission" in q)
        and ("patient" in q or "patients" in q)
    )


def force_admitted_patients_query_if_needed(question: str, sql_stmt: str) -> str:
    """Ensure admitted-patient questions include patient names from patients table, not doctor_assigned."""
    if not is_admitted_patients_question(question):
        return sql_stmt

    sql_l = (sql_stmt or "").lower()
    mentions_admit = " from admit" in sql_l or " join admit" in sql_l
    joins_patients = " join patients" in sql_l or " from patients" in sql_l

    # If question is about admitted patients but SQL only uses admit table (or picks doctor_assigned), force a safe query.
    if mentions_admit and (not joins_patients or "doctor_assigned" in sql_l):
        metadata = get_available_table_columns()
        admit_cols = set(metadata.get("admit", []))
        patient_cols = set(metadata.get("patients", []))

        # Cannot safely force a patient-name query without a valid foreign-key join.
        if "patient_id" not in admit_cols or "patient_id" not in patient_cols:
            return sql_stmt

        if {"full_name", "first_name", "last_name"}.issubset(patient_cols):
            patient_name_expr = (
                "COALESCE(NULLIF(TRIM(p.full_name), ''), "
                "CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) AS patient_name"
            )
        elif "full_name" in patient_cols:
            patient_name_expr = "p.full_name AS patient_name"
        elif {"first_name", "last_name"}.issubset(patient_cols):
            patient_name_expr = "CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS patient_name"
        else:
            patient_name_expr = "CAST(p.patient_id AS CHAR) AS patient_name"

        age_expr = (
            "TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age"
            if "dob" in patient_cols
            else "NULL AS age"
        )
        caregiver_expr = (
            "a.nurse_id AS nurse_id"
            if "nurse_id" in admit_cols
            else "a.staff_id AS staff_id"
            if "staff_id" in admit_cols
            else "NULL AS care_staff_id"
        )

        return (
            "SELECT "
            "a.admit_id, "
            "a.patient_id, "
            f"{patient_name_expr}, "
            f"{age_expr}, "
            "a.reason_for_admission, "
            "a.room_number, "
            "DATE(a.admission_date) AS admission_date, "
            "a.discharge_date, "
            f"{caregiver_expr} "
            "FROM admit a "
            "JOIN patients p ON p.patient_id = a.patient_id "
            "WHERE a.discharge_date IS NULL "
            "ORDER BY a.admission_date DESC"
        )

    return sql_stmt


def generate_schema_string(selected_tables: list[str]) -> str:
    if not MYSQL_URI:
        return "Database connection is not configured."

    try:
        dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
        return dynamic_db.get_table_info()
    except Exception as e:
        print(f"Admin AI schema loading error: {e}")
        return ""


def generate_sql_query(question: str, schema_string: str, selected_tables: list[str]) -> str:
    if not MYSQL_URI:
        return "Database connection is not configured."

    dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
    sql_prompt = PromptTemplate(
        input_variables=["input"],
        template=f"""
You are a helpful assistant that converts natural language questions into valid MySQL queries.
Given the following schema:
{schema_string}

Convert the following question into a syntactically correct and optimized SQL query for MySQL:
Question: {{input}}

Instructions:
- Use only table names and columns from the schema.
- Do not invent table or column names.
- If question asks unavailable data, respond with EXACTLY: The requested information is not available in the current database schema.
- Return ONLY a single SQL query, and nothing else.
- Avoid MySQL-incompatible pattern: LIMIT inside IN/ALL/ANY/SOME subqueries.
- If top-N filtering is needed, use a derived table + JOIN pattern instead.
- If the question is about patients (admitted/current patients), prioritize patient identity columns from patients table.
- Do not use doctors table for names unless the question explicitly asks for doctor details.
"""
    )
    dynamic_db_chain = SQLDatabaseChain.from_llm(
        llm=admin_llm,
        db=dynamic_db,
        prompt=sql_prompt,
        verbose=False,
        return_sql=True,
        return_intermediate_steps=False,
    )

    try:
        result = dynamic_db_chain.invoke(question)
        raw_sql = str(result.get("result") if isinstance(result, dict) else result).strip()

        if not raw_sql:
            return "I could not generate a valid SQL query for that question."

        normalized = raw_sql.replace("```sql", "").replace("```", "").strip()
        if UNAVAILABLE_MSG.lower() in normalized.lower():
            return UNAVAILABLE_MSG

        match = re.search(r"(?is)\b(select|with)\b.*?(;|$)", normalized)
        if not match:
            return "I could not generate a safe SQL query for that request."

        sql_stmt = match.group(0).strip().rstrip(";")
        sql_stmt = force_admitted_patients_query_if_needed(question, sql_stmt)

        try:
            query_result = dynamic_db.run(sql_stmt)
        except Exception as db_error:
            error_text = str(db_error)
            is_schema_error = (
                "Unknown column" in error_text
                or "Unknown table" in error_text
                or "doesn't exist" in error_text
            )
            is_mysql_compat_error = (
                "NotSupportedError" in error_text
                or "doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'" in error_text
                or "LIMIT & IN/ALL/ANY/SOME subquery" in error_text
            )

            if is_mysql_compat_error:
                rewritten_sql = rewrite_limit_in_subquery(sql_stmt)
                if rewritten_sql:
                    try:
                        query_result = dynamic_db.run(rewritten_sql)
                    except Exception:
                        query_result = None
                    if query_result not in (None, "", "[]"):
                        return str(query_result)

            if not (is_schema_error or is_mysql_compat_error):
                raise

            repair_prompt = PromptTemplate(
                input_variables=["question", "schema", "bad_sql", "error"],
                template="""
You are fixing a MySQL query.

Question:
{question}

Schema:
{schema}

Failing SQL:
{bad_sql}

Database error:
{error}

Requirements:
- Return ONLY one corrected SQL query using only the provided schema.
- Do NOT use LIMIT inside IN/ALL/ANY/SOME subqueries.
- If needed, rewrite using JOIN with a derived table/subquery.
""",
            )
            repair_response = admin_llm.invoke(
                repair_prompt.format(
                    question=question,
                    schema=schema_string,
                    bad_sql=sql_stmt,
                    error=error_text,
                )
            )
            repaired_raw = str(getattr(repair_response, "content", repair_response)).strip()
            repaired_raw = repaired_raw.replace("```sql", "").replace("```", "").strip()
            repaired_match = re.search(r"(?is)\b(select|with)\b.*?(;|$)", repaired_raw)
            if not repaired_match:
                return "I could not generate a valid query from your request and selected tables."

            repaired_sql = repaired_match.group(0).strip().rstrip(";")
            repaired_sql = force_admitted_patients_query_if_needed(question, repaired_sql)
            query_result = dynamic_db.run(repaired_sql)

        if query_result in (None, "", "[]"):
            return "No records found for your query."

        return str(query_result)
    except Exception as e:
        print(f"Admin AI SQL generation/execution error: {e}")
        return "I could not complete that query. Please try a simpler question or adjust selected tables."


def is_system_or_error_answer(answer: str) -> bool:
    if not answer:
        return True

    text = answer.lower()
    return any(
        marker in text
        for marker in [
            "i could not",
            "database connection is not configured",
            "the requested information is not available",
            "no records found",
            "internal issue",
            "please try",
        ]
    )


def _as_readable(value: Any) -> str:
    if value is None:
        return "null"
    return str(value)


def _clean_optional(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "nan"}:
        return None
    return text


def _looks_like_room(value: Any) -> bool:
    if value is None:
        return False
    text = str(value).strip()
    return bool(re.match(r"^[A-Za-z]-\d{2,4}$", text))


def _looks_like_date_text(value: Any) -> bool:
    if value is None:
        return False
    text = str(value).strip()
    return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", text))


def _looks_like_person_name(value: Any) -> bool:
    if value is None:
        return False
    text = str(value).strip()
    if not text or len(text) < 3 or len(text) > 80:
        return False
    # Require at least two alphabetic tokens to avoid treating conditions as names.
    return bool(re.match(r"^[A-Za-z]+(?:[ .'-][A-Za-z]+)+$", text))


def _format_admitted_patient_rows(parsed_rows: list[tuple]) -> Optional[str]:
    """Format common admitted-patient row shapes into user-friendly summary text."""
    if not parsed_rows:
        return None

    lines: list[str] = []
    for i, row in enumerate(parsed_rows, start=1):
        if not isinstance(row, tuple) or len(row) < 7:
            return None

        # Forced admitted query row shape:
        # [admit_id, patient_id, patient_name, age, reason, room, admission_date, discharge_date, ...]
        name = _clean_optional(row[2] if len(row) > 2 else None)
        if not _looks_like_person_name(name):
            return None

        reason = _clean_optional(row[4] if len(row) > 4 else None)
        room = _clean_optional(row[5] if len(row) > 5 and _looks_like_room(row[5]) else None)

        # Find first date-like value in row (already normalized to YYYY-MM-DD when possible).
        admission_date = None
        for value in row:
            if _looks_like_date_text(value):
                admission_date = str(value)
                break

        age = row[3] if len(row) > 3 and isinstance(row[3], int) and 0 < row[3] < 130 else None

        if not name:
            return None

        parts = [f"{i}. {name}"]
        if age is not None:
            parts.append(f"(age {age})")
        if reason:
            parts.append(f"- admitted for {reason}")
        if admission_date:
            parts.append(f"on {admission_date}")
        if room:
            parts.append(f"in room {room}")

        lines.append(" ".join(parts).strip())

    intro = f"Currently, there {'is' if len(parsed_rows) == 1 else 'are'} {len(parsed_rows)} admitted {'patient' if len(parsed_rows) == 1 else 'patients'}:"
    return intro + "\n" + "\n".join(lines)


def format_raw_sql_result(raw_answer: str, question: str = "") -> Optional[str]:
    """Convert tuple/list-like SQL output into deterministic natural language text."""
    if not raw_answer:
        return None

    text = raw_answer.strip()
    if not (text.startswith("[") and text.endswith("]")):
        return None

    # Normalize Python datetime reprs to plain strings so literal_eval can parse reliably.
    def _normalize_datetime_literals(value: str) -> str:
        value = re.sub(
            r"datetime\.datetime\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,[^)]*)?\)",
            lambda m: f'"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"',
            value,
            flags=re.DOTALL,
        )
        value = re.sub(
            r"datetime\.date\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
            lambda m: f'"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"',
            value,
            flags=re.DOTALL,
        )
        return value

    normalized_text = _normalize_datetime_literals(text)

    try:
        parsed = ast.literal_eval(normalized_text)
    except Exception:
        return None

    if not isinstance(parsed, list):
        return None
    if len(parsed) == 0:
        return "No matching records were found."

    first = parsed[0]
    if isinstance(first, tuple):
        q = (question or "").lower()
        if any(keyword in q for keyword in ["admit", "admission", "currently admitted", "admitted patients"]):
            patient_summary = _format_admitted_patient_rows(parsed)
            if patient_summary:
                return patient_summary

        width = len(first)
        if width == 1:
            values = [row[0] if isinstance(row, tuple) and len(row) == 1 else row for row in parsed[:8]]
            if len(values) == 1:
                return f"The result is {_as_readable(values[0])}."
            rendered = ", ".join(_as_readable(v) for v in values)
            suffix = "" if len(parsed) <= 8 else ", ..."
            return f"I found {len(parsed)} records. Values: {rendered}{suffix}."

        preview = []
        for row in parsed[:5]:
            if isinstance(row, tuple):
                preview.append(" | ".join(_as_readable(v) for v in row))
            else:
                preview.append(_as_readable(row))
        body = "\n".join(f"- {line}" for line in preview)
        more = "" if len(parsed) <= 5 else f"\n- ...and {len(parsed) - 5} more rows"
        return f"I found {len(parsed)} records. Top results:\n{body}{more}"

    rendered = ", ".join(_as_readable(v) for v in parsed[:8])
    suffix = "" if len(parsed) <= 8 else ", ..."
    return f"I found {len(parsed)} results: {rendered}{suffix}."


def natural_language_answer(question: str, raw_answer: str) -> str:
    """Convert raw SQL output into a concise, human-friendly response."""
    if is_system_or_error_answer(raw_answer):
        return raw_answer

    deterministic = format_raw_sql_result(raw_answer, question=question)
    if deterministic:
        # Prefer deterministic output to avoid LLM hallucinating or mislabeling fields.
        return deterministic

    base_answer = raw_answer

    prompt = PromptTemplate(
        input_variables=["question", "raw_answer"],
        template="""
You are a hospital admin assistant.

User question:
{question}

Raw database result:
{raw_answer}

Rewrite the result into clear natural language.
Rules:
- Be concise and factual.
- If there are multiple rows, summarize key points and include important values.
- Do not mention SQL, tables, or query syntax.
- If dates appear, keep them readable.
- If the result appears empty, say no matching records were found.
Return only the final answer text.
""",
    )

    try:
        response = admin_llm.invoke(
            prompt.format(question=question, raw_answer=base_answer)
        )
        text = str(getattr(response, "content", response)).strip()
        return text or base_answer
    except Exception as e:
        print(f"Admin AI natural-language formatting error: {e}")
        return base_answer

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        session_id = request.session_id
        
        # Initialize or retrieve state
        if session_id not in sessions:
            print(f"Creating new session: {session_id}")
            # Create initial state
            initial_state = HMAIState(
                user_input=request.message,
                patient_id=request.patient_id,
                session_id=session_id,
                image_base64=request.image_base64
            )
            current_state_dict = initial_state.dict()
        else:
            print(f"Resuming session: {session_id}")
            current_state_dict = sessions[session_id]
            
            # Reset per-turn fields that should be fresh for each message
            current_state_dict["user_input"] = request.message
            current_state_dict["image_base64"] = request.image_base64
            current_state_dict["session_id"] = session_id
            current_state_dict["intent"] = None
            current_state_dict["final_response"] = None
            current_state_dict["next_prompt"] = None
            current_state_dict["follow_up_required"] = False
            current_state_dict["last_sender"] = "user"
            
            # Preserve booking context fields:
            # - booking_stage
            # - available_doctors
            # - selected_doctor
            # - available_slots
            # - selected_slot
            # - diagnosis_condition
            # - appointment_date
            # - appointment_time
            # - appointee_name, appointee_email, appointee_contact
            # These are NOT reset, so they carry over from previous turns
            
            # Ensure patient_id is set if provided
            if request.patient_id:
                current_state_dict["patient_id"] = request.patient_id

        # Invoke the graph
        # LangGraph invoke takes the state (dict or object)
        final_state_dict = patient_graph.invoke(current_state_dict)
        
        # Update session store
        sessions[session_id] = final_state_dict
        
        # Determine response
        # If follow_up_required is True, use next_prompt
        # Else use final_response
        
        reply = ""
        if final_state_dict.get("follow_up_required"):
            reply = final_state_dict.get("next_prompt", "I need some more information.")
        else:
            reply = final_state_dict.get("final_response", "I processed your request.")
            
        # Fallback if both are empty (shouldn't happen with correct logic)
        if not reply:
            reply = "I'm not sure how to respond to that."

        return ChatResponse(reply=reply, session_id=session_id)

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai", response_model=AdminAiResponse)
async def admin_ai_endpoint(request: AdminAiRequest):
    try:
        # Dynamic table intent: infer relevant tables from question + known schema metadata.
        inferred_tables = infer_tables_from_question(request.question)

        # Keep backward compatibility: if checklist has values, use them as extra hints.
        selected_tables = list(dict.fromkeys(inferred_tables + (request.selected_tables or [])))[:6]

        schema_string = generate_schema_string(selected_tables)
        if not schema_string:
            return AdminAiResponse(
                answer="I could not load schema for the selected tables. Please review selected tables and try again.",
                session_id=request.session_id,
                selected_tables=selected_tables,
            )

        raw_answer = generate_sql_query(request.question, schema_string, selected_tables)
        answer = natural_language_answer(request.question, raw_answer)
        return AdminAiResponse(answer=answer, session_id=request.session_id, selected_tables=selected_tables)
    except Exception as e:
        print(f"Error in admin ai endpoint: {e}")
        import traceback
        traceback.print_exc()
        return AdminAiResponse(
            answer="I ran into an internal issue while answering. Please try a simpler question or reselect tables.",
            session_id=request.session_id,
            selected_tables=[],
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
