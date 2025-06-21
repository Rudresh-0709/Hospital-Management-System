import os
import sys
from dotenv import load_dotenv
from langchain.agents import Tool,initialize_agent
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_experimental.sql import SQLDatabaseChain
from langchain.prompts import PromptTemplate
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory


load_dotenv()
MYSQL_URI = os.getenv("MYSQL_URI")

if not MYSQL_URI:
    raise ValueError("Database URI is missing. Set it in the .env file.")

llm=ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

# Step 1: Connect to the Database (Only do this once)
db = SQLDatabase.from_uri(MYSQL_URI)
def get_sql_table_schema(selected_tables:list[str]=None):
    """
    Returns an SQL schema for optionally filtering the existing SQL Database."""
    if selected_tables:
        return SQLDatabase.from_uri(MYSQL_URI, include_tables=selected_tables)
    else:
        print("No tables selected, using all available tables.")
        return SQLDatabase.from_uri(MYSQL_URI)
    
def run_dynamic_sql_query(query:str, **kwargs)-> str :

    selected_tables = kwargs.get("allowed_tables", None)

    dynamic_db = get_sql_table_schema(selected_tables)
    dynamic_schema=dynamic_db.get_table_info()

    sql_prompt = PromptTemplate(
        input_variables=["input"],
        template=f"""
            You are a helpful assistant that converts natural language questions into valid MySQL queries.
            Given the following schema:
            {dynamic_schema}

            Convert the following question into a syntactically correct and optimized SQL query for MySQL:
            Question: {{input}}

            Instructions:
            - Use proper SQL syntax.
            - If you use aggregate functions (e.g., COUNT, SUM, AVG), you MUST include a GROUP BY clause for all non-aggregated columns.
            - Return ONLY the SQL query, no explanations, comments, or markdown formatting.
            - DO NOT guess column names. Use only columns that are present in the schema above.
            """
    )
    dynamic_db_chain = SQLDatabaseChain.from_llm(
        llm=llm,
        db=dynamic_db,
        prompt=sql_prompt,
        verbose=False,
        return_direct=True
    )
    return dynamic_db_chain.invoke(query)


sql_tool=Tool(
    name="MySQL Database Query",
    func=run_dynamic_sql_query,
    description="Use this to answer questions about hospital data. Always prefer using SQL."
)
agent = initialize_agent(
    tools=[sql_tool],
    llm=llm,
    agent="zero-shot-react-description",
    verbose=False
)
def history_factory(session_id:str):
    return ChatMessageHistory(session_id=session_id)

agent_with_memory = RunnableWithMessageHistory(
    agent,
    lambda session_id: history_factory(session_id),
    input_messages_key="input",
    history_messages_key="chat_history"
)

if __name__ == "__main__":
    print("Ask questions about your MySQL database (type 'exit' to quit):\n")
    session_id = "user123"  # You can make this dynamic if needed

    user_query = input("> ")

    result = agent_with_memory.invoke(
        {"input": user_query},
        config={"configurable": {"session_id": session_id}}
    )

    