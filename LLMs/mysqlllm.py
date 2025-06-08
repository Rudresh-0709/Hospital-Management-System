import os
import sys
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_experimental.sql import SQLDatabaseChain
from langchain.prompts import PromptTemplate

load_dotenv()
MYSQL_URI = os.getenv("MYSQL_URI")

if not MYSQL_URI:
    raise ValueError("Database URI is missing. Set it in the .env file.")

# Step 1: Connect to the Database (Only do this once)
db = SQLDatabase.from_uri(MYSQL_URI)

# Step 2: Define an SQL query generation function using PromptTemplate
def generate_sql_query(question):

    schema = db.get_table_info(["doctors","appointments"])
    sql_prompt = PromptTemplate(
        input_variables=["schema","question"],
        template=(
            "Given the following MySQL database schema:\n"
            "{schema}\n"
            "Convert the following question into an optimized SQL query for MySQL:\n"
            "{question}\n"
            "Return only the SQL statement without explanation or formatting."
        )
    )
    return sql_prompt.format(schema=schema, question=question)

# Step 3: Create LangChain SQL wrapper
def create_langchain_mysql_chain():
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    db_chain = SQLDatabaseChain.from_llm(llm, db, verbose=False, return_direct=True)  # Remove `prompt` parameter
    return db_chain

# Step 4: Query AI using natural language
def ask_ai_question(question):
    db_chain = create_langchain_mysql_chain()
    formatted_query = generate_sql_query(question)  # Use the fixed prompt template
    
    print("\nGenerated SQL Query:\n", formatted_query)
    # Execute the SQL query and get the result
    query_result = db_chain.invoke(formatted_query)
    
    # Use the LLM to convert the result into natural language
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    explanation_prompt = PromptTemplate(
        input_variables=["question", "result"],
        template="The user asked: {question}\nThe database returned: {result}\nProvide a clear and concise natural language explanation of the result."
    )
    explanation = llm.invoke(
        explanation_prompt.format(question=question, result=query_result)
    )
    
    return explanation

if __name__ == "__main__":
    user_query = input("Ask a question about your MySQL database:\n> ")
    result = ask_ai_question(user_query)
    print("\nAI Response:\n", result.content)
