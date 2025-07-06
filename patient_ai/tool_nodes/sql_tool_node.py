from langchain.agents import Tool
from langchain_experimental.sql import SQLDatabaseChain
from langchain_community.utilities import SQLDatabase
import os
import yaml
from langchain_groq import ChatGroq

with open("config.yaml", "r") as file:
    config = yaml.safe_load(file)

db_uri = os.getenv(config["sql"]["uri_env"])
db=SQLDatabase.from_uri(db_uri)

llm = ChatGroq(
    model=config["llm"]["groq_fast"]["model_name"],
    api_key=os.get_env(config["llm"]["groq_fast"]["api_key_env"]),
    temperature=0.1
)
sql_chain=SQLDatabaseChain.from_llm(
    llm,
    db,
    verbose=False
)
def run_sql_query(query:str)->str:
    return sql_chain.invoke(query)

sql_tool=Tool(
    name="SQLQueryTool",
    func=run_sql_query,
    description=(
        "Useful for answering questions that require accessing the hospital database, "
        "like patient records, appointment schedules, or doctor availability. "
        "Input should be a natural language question."
    )
)