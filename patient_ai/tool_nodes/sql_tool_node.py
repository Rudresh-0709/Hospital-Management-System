from langchain.agents import Tool
from langchain_experimental.sql import SQLDatabaseChain
from langchain_community.utilities import SQLDatabase
import os
import yaml
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

with open("config.yaml", "r") as file:
    config = yaml.safe_load(file)

db_uri = os.getenv(config["sql"]["uri_env"])
llm = ChatGroq(
    model=config["llm"]["groq_fast"]["model_name"],
    api_key=os.getenv(config["llm"]["groq_fast"]["api_key_env"]),
    temperature=0.1
)


def clean_query(query: str) -> str:
    # Check for unexpected types (should be str)
    if not isinstance(query, str):
        return str(query) # Convert to string to avoid further errors

    stripped_lower_query = query.strip().lower()

    if stripped_lower_query.startswith("sql query:"):
        cleaned = query.split(":", 1)[1].strip()
        return cleaned
    else:
        return query

def build_sql_tool(allowed_tables: list, patient_id: int = None) -> Tool:
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)
    schema_info = db.get_table_info(table_names=allowed_tables)

    custom_template = """
        You are a world-class MySQL expert.
        You may query only the tables below.

        {table_info}

        The current patient_id is: {patient_id}

        Given the user question, produce ONE valid MySQL statement that answers it.
        If the question is about the user, use the patient_id in the WHERE clause.
        Return ONLY the SQL itself – no prefix, no explanations, no markdown fences.
        Question: {input}
        SQL:
        """.strip()

    prompt = PromptTemplate(
        input_variables=["input", "table_info"],          
        partial_variables={                              
            "patient_id": int(patient_id) if patient_id is not None else ""
        },
        template=custom_template,
    )

    sql_chain = SQLDatabaseChain.from_llm(
        llm=llm,
        db=db,
        use_query_checker=True,
        prompt=prompt,
        verbose=False,
        top_k=5,
        return_direct=True
    )

    def tool_func(query):
        return sql_chain.invoke({
            "query": clean_query(query),
            "input": query,
            "table_info": schema_info,
            "patient_id": patient_id if patient_id is not None else "",
        })

    return Tool(
        name=f"SQLTool_{'_'.join(allowed_tables)}",
        func=tool_func,
        description=f"Queries only the following tables: {', '.join(allowed_tables)}"
    )

def run_sql_query(query: str, allowed_tables: list) -> str:
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)

    custom_template = """
        You are a world-class MySQL expert.
        You may query only the tables below.

        {table_info}

        Given the user question, produce ONE valid MySQL statement that answers it.
        If the question is related to the patient itself than use its patient id.
        Return ONLY the SQL itself – no prefix, no explanations, no markdown fences.
        Question: {input}
        SQL:
        """.strip()

    prompt = PromptTemplate(
        input_variables=["input", "table_info"],
        template=custom_template,
    )
    sql_chain = SQLDatabaseChain.from_llm(
        llm=llm,
        db=db,
        use_query_checker=True,
        prompt=prompt,
        verbose=False,
        top_k=5
    )
    result = sql_chain.invoke({"query": clean_query(query)})
    return str(result)

def sql_to_nl(question: str, rows: list | str) -> str:
    """Turn DB rows into a user-friendly sentence."""
    prompt = f"""
    The user asked: {question}
    The database returned: {rows}

    Please answer the user in natural language using the data above.
    Make it short and simple.
    """.strip()
    return llm.invoke(prompt).content