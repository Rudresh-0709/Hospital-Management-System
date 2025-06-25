import os
import sys
from dotenv import load_dotenv
from langchain.agents import Tool,initialize_agent, AgentType
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_experimental.sql import SQLDatabaseChain
from langchain.prompts import PromptTemplate
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from pydantic import BaseModel, Field


load_dotenv()
MYSQL_URI = os.getenv("MYSQL_URI")

if not MYSQL_URI:
    raise ValueError("Database URI is missing. Set it in the .env file.")

llm=ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

# Step 1: Connect to the Database (Only do this once)
db = SQLDatabase.from_uri(MYSQL_URI)

# def get_sql_table_schema(selected_tables: list[str] = None):
#     print("get_sql_table_schema called with:", selected_tables)
#     """
#     Returns an SQL schema for optionally filtering the existing SQL Database."""
#     if selected_tables:
#         # Fetch the schema for the specified tables
#         dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
#     else:
#         print("No tables selected, using all available tables.")
#         dynamic_db = SQLDatabase.from_uri(MYSQL_URI)
    
#     # Print the schema to verify
#     schema_info = dynamic_db.get_table_info()
#     print("Schema retrieved:", schema_info)
#     return dynamic_db


# def run_dynamic_sql_query(input: str, allowed_tables: list[str] = None):
#     query = input
#     selected_tables = allowed_tables
#     dynamic_db = get_sql_table_schema(selected_tables)
#     dynamic_schema = dynamic_db.get_table_info()
#     print("=== SCHEMA PASSED TO LLM ===")
#     print(dynamic_schema)
#     print("============================")
    
#     # Check if the allowed tables are valid
#     if not selected_tables or not all(table in dynamic_schema for table in selected_tables):
#         return "The requested information is not available in the current database schema."
#     sql_prompt = PromptTemplate(
#         input_variables=["input"],
#         template=f"""
#             You are a helpful assistant that converts natural language questions into valid MySQL queries.
#             Given the following schema:
#             {dynamic_schema}

#             Convert the following question into a syntactically correct and optimized SQL query for MySQL:
#             Question: {{input}}

#             Instructions:
#             - You MUST use only the table names and columns exactly as shown in the schema above.
#             - Do NOT guess, pluralize, or invent table names or columns.
#             - If the question refers to a table or column not present in the schema, respond with: "The requested information is not available in the current database schema."
#             - Return ONLY the SQL query, no explanations, comments, or markdown formatting.
#             - DO NOT guess column names. Use only columns that are present in the schema above.
#             """
#     )
#     dynamic_db_chain = SQLDatabaseChain.from_llm(
#         llm=llm,
#         db=dynamic_db,
#         prompt=sql_prompt,
#         verbose=False,
#         return_direct=True
#     )
    
#     return dynamic_db_chain.invoke(query)


def history_factory(session_id:str):
    return ChatMessageHistory(session_id=session_id)


def generate_schema_string(selected_tables: list[str]) -> str:
    dynamic_db = SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
    return dynamic_db.get_table_info()


def generate_sql_query(question: str, schema_string: str, selected_tables: list[str]) -> str:
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
            - You MUST use only the table names and columns exactly as shown in the schema above.
            - Do NOT guess, pluralize, or invent table names or columns.
            - If the question refers to a table or column not present in the schema, respond with: "The requested information is not available in the current database schema."
            - Return ONLY the SQL query, no explanations, comments, or markdown formatting.
            - DO NOT guess column names. Use only columns that are present in the schema above.
            """
    )
    dynamic_db_chain = SQLDatabaseChain.from_llm(
        llm=llm,
        db=dynamic_db,
        prompt=sql_prompt,
        verbose=False,
        return_sql=True
    )
    return dynamic_db_chain.invoke(question)



