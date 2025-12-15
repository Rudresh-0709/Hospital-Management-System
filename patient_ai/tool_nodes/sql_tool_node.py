"""
SQL Tool Node - Generates and executes SQL queries with patient privacy enforcement.

This module provides tools for querying the hospital database with strict
patient data isolation.
"""

from langchain_community.utilities import SQLDatabase
import os
import yaml
import re
from langchain_groq import ChatGroq

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_path = os.path.join(base_dir, "config.yaml")

with open(config_path, "r") as file:
    config = yaml.safe_load(file)

db_uri = os.getenv(config["sql"]["uri_env"])
llm = ChatGroq(
    model=config["llm"]["groq_fast"]["model_name"],
    api_key=os.getenv(config["llm"]["groq_fast"]["api_key_env"]),
    temperature=0.1,
)


def get_patient_email(patient_id: int) -> str | None:
    """Get the email address for a patient by their ID."""
    from .doctor_tool import sql_connector

    try:
        conn = sql_connector()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT email FROM patients WHERE patient_id = %s", (patient_id,)
        )
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result["email"] if result else None
    except Exception as e:
        print(f"Error getting patient email: {e}")
        return None


def clean_sql_response(response: str) -> str:
    """Clean the LLM response to extract just the SQL query."""
    sql = response.strip()

    # Remove markdown code blocks
    if sql.startswith("```sql"):
        sql = sql[6:]
    elif sql.startswith("```"):
        sql = sql[3:]
    if sql.endswith("```"):
        sql = sql[:-3]

    # Remove common prefixes
    prefixes = ["SQL:", "sql:", "Query:", "query:"]
    for prefix in prefixes:
        if sql.lower().startswith(prefix.lower()):
            sql = sql[len(prefix) :]

    return sql.strip()


def generate_sql_query(
    user_question: str,
    table_info: str,
    patient_id: int,
    patient_email: str,
    allowed_tables: list,
) -> str:
    """
    Use LLM to generate a SQL query based on user question.
    Returns the generated SQL query string.
    """
    allowed_tables_str = ", ".join(allowed_tables)

    prompt = f"""You are a MySQL expert for a hospital management system.

AVAILABLE TABLES: {allowed_tables_str}

TABLE SCHEMA:
{table_info}

CURRENT USER CONTEXT:
- Patient ID: {patient_id}
- Patient Email: {patient_email}

CRITICAL SECURITY RULES:
1. For tables with patient_id column (patients, prescriptions, admit, diagnosis):
   - ALL queries MUST include "WHERE patient_id = {patient_id}"
   
2. For the appointments table (patient_id column may NOT exist):
   - Use "WHERE appointee_email = '{patient_email}'" to filter appointments
   - This ensures only THIS patient's appointments are returned
   
3. For general tables like 'doctors': no patient filter needed

4. NEVER return data belonging to other patients

QUERY GUIDELINES:
- If user asks about "all" their records, return ALL matching records (no extra status filter)
- If user asks "which are completed" or "which are pending", SELECT all records WITH status column so the response can describe each status
- Always include useful columns: appointment_id, status, date, time, doctor_name, purpose
- Order results by date (most recent first) when appropriate
- For "list my appointments and which are completed" → return all appointments with their status column

USER QUESTION: {user_question}

Generate a single MySQL query to answer this question.
Return ONLY the raw SQL query. No explanations, no markdown, no code blocks."""

    response = llm.invoke(prompt)
    sql = response.content if hasattr(response, "content") else str(response)
    return clean_sql_response(sql)


def execute_sql_query(sql: str, allowed_tables: list) -> str:
    """
    Execute a SQL query and return the results as a string.
    """
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)

    try:
        result = db.run(sql)
        return result
    except Exception as e:
        return f"Database error: {str(e)}"


def build_sql_tool(allowed_tables: list, patient_id: int = None):
    """
    Build a SQL tool that generates and executes queries with patient privacy.
    """
    from langchain.tools import Tool

    # Get database schema
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)
    table_info = db.get_table_info(table_names=allowed_tables)

    # Get patient's email for matching
    patient_email = get_patient_email(patient_id) if patient_id else ""

    def tool_func(user_query: str) -> dict:
        """Execute a SQL query based on user's natural language question."""
        if patient_id is None:
            return {
                "query": user_query,
                "result": "Patient ID is required to access personal records.",
                "sql": None,
            }

        try:
            # Step 1: Generate SQL using LLM
            sql = generate_sql_query(
                user_question=user_query,
                table_info=table_info,
                patient_id=patient_id,
                patient_email=patient_email or "",
                allowed_tables=allowed_tables,
            )
            print(f"DEBUG Generated SQL: {sql}")

            # Step 2: Execute the query
            result = execute_sql_query(sql, allowed_tables)
            print(
                f"DEBUG Query Result: {result[:200] if len(str(result)) > 200 else result}"
            )

            return {"query": user_query, "result": result, "sql": sql}

        except Exception as e:
            print(f"SQL tool error: {e}")
            import traceback

            traceback.print_exc()
            return {"query": user_query, "result": f"Error: {str(e)}", "sql": None}

    return Tool(
        name=f"SQLTool_{'_'.join(allowed_tables)}",
        func=tool_func,
        description=f"Queries the following tables: {', '.join(allowed_tables)}. Enforces patient privacy.",
    )


def run_sql_query(query: str, allowed_tables: list, patient_id: int = None) -> str:
    """
    Run a SQL query with patient privacy enforcement.
    """
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)
    table_info = db.get_table_info(table_names=allowed_tables)
    patient_email = get_patient_email(patient_id) if patient_id else ""

    sql = generate_sql_query(
        user_question=query,
        table_info=table_info,
        patient_id=patient_id,
        patient_email=patient_email or "",
        allowed_tables=allowed_tables,
    )

    return execute_sql_query(sql, allowed_tables)


def sql_to_nl(question: str, rows: list | str) -> str:
    """Turn DB rows into a user-friendly sentence."""
    prompt = f"""
The user asked: {question}
The database returned: {rows}

Please answer the user in natural language using the data above.
- Make it short, friendly, and easy to understand
- If there are multiple records, summarize them clearly (e.g., "You have 3 appointments: 2 scheduled and 1 completed")
- If no data was found or result is empty, say so politely
- Include relevant details like dates, doctor names, status
""".strip()
    resp = llm.invoke(prompt)
    return resp.content if hasattr(resp, "content") else str(resp)
