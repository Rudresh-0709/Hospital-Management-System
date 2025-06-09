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

# Step 1: Connect to the Database (Only do this once)
db = SQLDatabase.from_uri(MYSQL_URI)


# # Step 2: Define an SQL query generation function using PromptTemplate
# def generate_sql_query(question):
#     schema = db.get_table_info(["doctors", "appointments"])
#     sql_prompt = PromptTemplate(
#     input_variables=["schema", "question"],
#     template=(
#         "You are a helpful assistant that converts natural language questions into valid MySQL queries.\n"
#         "Given the following schema:\n"
#         "{schema}\n\n"
#         "Convert the following question into a syntactically correct and optimized SQL query for MySQL:\n"
#         "Question: {question}\n\n"
#         "Instructions:\n"
#         "- Use proper SQL syntax.\n"
#         "- If you use aggregate functions (e.g., COUNT, SUM, AVG), you MUST include a GROUP BY clause for all non-aggregated columns.\n"
#         "- Return ONLY the SQL query, no explanations, comments, or markdown formatting.\n"
#         "- DO NOT guess column names. Use only columns that are present in the schema above.\n"
#     )
# )

#     return sql_prompt.format(schema=schema, question=question)

# # Step 3: Create LangChain SQL wrapper
# def create_langchain_mysql_chain():
#     llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
#     db_chain = SQLDatabaseChain.from_llm(llm, db,use_query_checker=True, verbose=False, return_direct=True)  # Remove `prompt` parameter
#     return db_chain

# # Step 4: Query AI using natural language
# def ask_ai_question(question):
#     db_chain = create_langchain_mysql_chain()
#     formatted_query = generate_sql_query(question)  # Use the fixed prompt template
    
#     print("\nGenerated SQL Query:\n", formatted_query)
#     # Execute the SQL query and get the result
#     query_result = db_chain.invoke(formatted_query)
    
#     # Use the LLM to convert the result into natural language
#     llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
#     explanation_prompt = PromptTemplate(
#         input_variables=["question", "result"],
#         template="The user asked: {question}\nThe database returned: {result}\nProvide a clear and concise natural language explanation of the result."
#     )
#     explanation = llm.invoke(
#         explanation_prompt.format(question=question, result=query_result)
#     )
    
#     return explanation

# if __name__ == "__main__":
#     user_query = input("Ask a question about your MySQL database:\n> ")
#     result = ask_ai_question(user_query)
#     print("\nAI Response:\n", result.content)
schema = db.get_table_info(["doctors", "appointments"])
sql_prompt = PromptTemplate(
    input_variables=["input"],
    template=f"""
        You are a helpful assistant that converts natural language questions into valid MySQL queries.
        Given the following schema:
        {schema}

        Convert the following question into a syntactically correct and optimized SQL query for MySQL:
        Question: {{input}}

        Instructions:
        - Use proper SQL syntax.
        - If you use aggregate functions (e.g., COUNT, SUM, AVG), you MUST include a GROUP BY clause for all non-aggregated columns.
        - Return ONLY the SQL query, no explanations, comments, or markdown formatting.
        - DO NOT guess column names. Use only columns that are present in the schema above.
        """
)

llm=ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
db_chain = SQLDatabaseChain.from_llm(llm,db, prompt=sql_prompt, verbose=False, return_direct=True, use_query_checker=True)

def run_sql_chain(query:str)->str:
    return db_chain.invoke(query)

sql_tool=Tool(
    name="MySQL Database Query",
    func=run_sql_chain,
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

    