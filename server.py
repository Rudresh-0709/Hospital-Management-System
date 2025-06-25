from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from LLMs.mysqlllm import generate_schema_string, generate_sql_query, llm
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

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
    selected_tables: list[str] = []
# @app.post("/ai")
# async def get_ai_response(data: Question):
#     print("Allowed tables passed to LLM:", data.selected_tables)
#     # Step 1: Generate schema string for selected tables
#     schema_string = generate_schema_string(data.selected_tables)
#     # Step 2: Generate SQL query using question and schema
#     response_text = generate_sql_query(data.question, schema_string,data.selected_tables)
#     # (Optional) Save chat history as before
#     conn = mysql.connector.connect(
#         host="localhost",
#         user="root",
#         password="ishowhell",
#         database="hospital"
#     )

#     cursor = conn.cursor()

#     # If response_text is a dict, extract the answer or SQL string
#     if isinstance(response_text, dict):
#         # Adjust the key as needed, e.g., 'answer', 'sql', or 'result'
#         answer_str = response_text.get("answer") or response_text.get("sql") or str(response_text)
#     else:
#         answer_str = str(response_text)

#     cursor.execute(
#         "INSERT INTO chat_history (session_uuid, question, answer) VALUES (%s, %s, %s)",
#         (data.session_id, data.question, answer_str)
#     )
#     conn.commit()
#     cursor.close()
#     conn.close()
#     return {"answer": answer_str}

@app.post("/ai")
async def get_ai_response(data: Question):
    conn = None # Initialize conn to None
    cursor = None # Initialize cursor to None
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="ishowhell",
            database="hospital"
        )
        cursor = conn.cursor()

        schema_string = generate_schema_string(data.selected_tables)
        print("Schema sent to LLM:\n", schema_string)
        sql_query = generate_sql_query(data.question, schema_string, data.selected_tables)
        print("Raw LLM output for SQL:", sql_query)
        if isinstance(sql_query, dict):
            sql_query_str = sql_query.get("result")
        else:
            sql_query_str = str(sql_query)

        if not sql_query_str.strip().lower().startswith("select"):
            print("Invalid SQL query generated:", sql_query_str)
            return {"answer": "Sorry, I couldn't generate a valid SQL query for your question."}

        cursor.execute(sql_query_str)
        result = cursor.fetchall()
        print("SQL Query Executed:", sql_query_str)
        explanation_prompt = f"""
        Given the following SQL result:
        {result}
        Provide a natural language answer to the question: "{data.question}"
        """
        explanation_msg = llm.invoke(explanation_prompt)
        explanation=explanation_msg.content

        cursor.execute(
            "INSERT INTO chat_history (session_uuid, question, answer) VALUES (%s, %s, %s)",
            (data.session_id, data.question, explanation)
        )
        conn.commit()
        print(explanation)
        return {"answer": explanation}
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return {"answer": "An error occurred while accessing the database. Please try again."}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"answer": "An unexpected error occurred. Please try again."}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
