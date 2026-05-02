# -*- coding: utf-8 -*-
"""
Script to add admin AI endpoint to server.py
"""

import re

# Read the current server.py
with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if admin AI is already added
if '@app.post("/ai"' in content:
    print("[INFO] Admin AI endpoint already exists in server.py")
    exit(0)

# Find the imports section and add new imports after load_dotenv()
imports_to_add = """import os
import mysql.connector
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain.prompts import PromptTemplate
"""

# Add imports after load_dotenv()
content = content.replace(
    "load_dotenv()\n\n# Import the LangGraph app",
    f"load_dotenv()\n\n{imports_to_add}\n# Import the LangGraph app"
)

# Admin AI models and helper functions to add before the patient AI endpoint
admin_ai_code = '''
# ============ Admin AI Models and Functions ============
class AdminAiRequest(BaseModel):
    question: str
    session_id: str
    selected_tables: list[str] = []

class AdminAiResponse(BaseModel):
    answer: str
    session_id: str
    generated_name: Optional[str] = None

# Setup Admin AI LLM and Database
MYSQL_URI = os.getenv("MYSQL_URI")
if not MYSQL_URI:
    print("Warning: MYSQL_URI not set. Admin AI features may not work.")

admin_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

def generate_schema_string(selected_tables: list[str]) -> str:
    """Generate SQL schema for selected tables"""
    if not MYSQL_URI:
        return "No database connection available."
    try:
        dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
        return dynamic_db.get_table_info()
    except Exception as e:
        print(f"Error generating schema: {e}")
        return f"Error generating schema: {str(e)}"

def generate_sql_query(question: str, schema_string: str, selected_tables: list[str]) -> str:
    """Generate and execute SQL query based on natural language question"""
    if not MYSQL_URI:
        return "No database connection available."
    try:
        dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
        sql_prompt = PromptTemplate(
            input_variables=["input"],
            template=f"""You are a helpful assistant that converts natural language questions into valid MySQL queries.
Given the following schema:
{schema_string}

Convert the following question into a syntactically correct and optimized SQL query for MySQL:
Question: {{input}}

Instructions:
- You MUST use only the table names and columns exactly as shown in the schema above.
- Do NOT guess, pluralize, or invent table names or columns.
- If the question refers to a table or column not present in the schema, respond with: "The requested information is not available in the current database schema."
- Return ONLY the SQL query, no explanations, comments, or markdown formatting.
- DO NOT guess column names. Use only columns that are present in the schema above."""
        )
        dynamic_db_chain = SQLDatabaseChain.from_llm(
            llm=admin_llm,
            db=dynamic_db,
            prompt=sql_prompt,
            verbose=False,
            return_intermediate_steps=False
        )
        result = dynamic_db_chain.invoke(question)
        return result if isinstance(result, str) else result.get("result", str(result))
    except Exception as e:
        print(f"Error generating query: {e}")
        return f"Error processing question: {str(e)}"

def generate_chat_name(question: str) -> str:
    """Generate a smart, concise name (1-5 words) for the chat"""
    try:
        name_prompt = PromptTemplate(
            input_variables=["question"],
            template="""Based on this question, generate a very short chat topic name (1-5 words max).
The name should summarize what the conversation is about.
Question: {question}
Return ONLY the chat name, no quotes, no explanations."""
        )
        chain = name_prompt | admin_llm
        response = chain.invoke({"question": question})
        name = response.content.strip() if hasattr(response, 'content') else str(response).strip()
        name = name.replace('"', '').replace("'", '').strip()
        return name[:50] if name else "Chat"
    except Exception as e:
        print(f"Error generating chat name: {e}")
        return "Chat"

def get_first_message_count(session_id: str) -> int:
    """Check if this is the first message in a session"""
    if not MYSQL_URI:
        return 0
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "hospital")
        )
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM chat_history WHERE session_uuid = %s", (session_id,))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return count
    except Exception as e:
        print(f"Error checking message count: {e}")
        return 1

def update_chat_session_name(session_id: str, name: str):
    """Update the chat session name in database"""
    if not MYSQL_URI:
        return
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "hospital")
        )
        cursor = conn.cursor()
        cursor.execute("UPDATE chat_session SET name = %s WHERE session_uuid = %s", (name, session_id))
        conn.commit()
        cursor.close()
        conn.close()
        print(f"[OK] Chat auto-named: {name}")
    except Exception as e:
        print(f"Error updating chat session name: {e}")

@app.post("/ai", response_model=AdminAiResponse)
async def admin_ai_endpoint(request: AdminAiRequest):
    """Admin AI endpoint - handles database queries with auto-naming on first message"""
    try:
        question = request.question
        session_id = request.session_id
        selected_tables = request.selected_tables or []
        
        print(f"[Request] Admin AI - Session: {session_id}, Tables: {selected_tables}")
        
        answer = "I cannot answer that question without selecting relevant tables."
        if selected_tables:
            schema_string = generate_schema_string(selected_tables)
            answer = generate_sql_query(question, schema_string, selected_tables)
        
        generated_name = None
        message_count = get_first_message_count(session_id)
        if message_count == 0:
            generated_name = generate_chat_name(question)
            update_chat_session_name(session_id, generated_name)
        
        return AdminAiResponse(
            answer=answer,
            session_id=session_id,
            generated_name=generated_name
        )
        
    except Exception as e:
        print(f"[Error] Admin AI endpoint error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

'''

# Find the patient AI endpoint (@app.post("/chat")) and insert admin AI before it
pattern = r'(@app\.post\("/chat", response_model=ChatResponse\))'
replacement = f"{admin_ai_code}\n\\1"
content = re.sub(pattern, replacement, content, count=1)

# Write the updated content back
with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Successfully added admin AI endpoint to server.py")
print("[OK] Admin AI features added:")
print("  - /ai endpoint for admin AI chat queries")
print("  - Auto-naming: First message generates smart chat name")
print("  - SQL query generation from natural language")
