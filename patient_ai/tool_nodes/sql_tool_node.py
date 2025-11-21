from langchain.agents import Tool
from langchain_experimental.sql import SQLDatabaseChain
from langchain_community.utilities import SQLDatabase
import os
import yaml
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_path = os.path.join(base_dir, "config.yaml")

with open(config_path, "r") as file:
    config = yaml.safe_load(file)
db_uri = os.getenv(config["sql"]["uri_env"])
llm = ChatGroq(
    model=config["llm"]["groq_fast"]["model_name"],
    api_key=os.getenv(config["llm"]["groq_fast"]["api_key_env"]),
    temperature=0.1
)


def clean_query(query) -> str:
    """Safely convert query (AIMessage or other types) to a plain string."""
    # Handle AIMessage or Message-like objects
    if hasattr(query, "content"):
        query = query.content

    # Convert non-strings
    if not isinstance(query, str):
        query = str(query)

    stripped_lower_query = query.strip().lower()

    if stripped_lower_query.startswith("sql query:"):
        cleaned = query.split(":", 1)[1].strip()
        return cleaned
    else:
        return query.strip()


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

    def tool_func(user_query):
        cleaned = clean_query(user_query)
        try:
            result = sql_chain.invoke({
                "input": cleaned,
                "table_info": schema_info,
                "patient_id": patient_id if patient_id is not None else "",
            })
        except Exception as e:
            # Some chain implementations expect 'query' as the input key or support run()
            try:
                result = sql_chain.invoke({
                    "query": cleaned,
                    "table_info": schema_info,
                    "patient_id": patient_id if patient_id is not None else "",
                })
            except Exception:
                # final fallback to run which usually accepts a single string
                try:
                    result = sql_chain.run(cleaned)
                except Exception as e2:
                    raise e2
        # Normalize AIMessage-like responses
        if hasattr(result, "content"):
            return result.content
        return str(result)

    return Tool(
        name=f"SQLTool_{'_'.join(allowed_tables)}",
        func=tool_func,
        description=f"Queries only the following tables: {', '.join(allowed_tables)}"
    )


def run_sql_query(query: str, allowed_tables: list) -> str:
    db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)
    schema_info = db.get_table_info(table_names=allowed_tables)

    custom_template = """
        You are a world-class MySQL expert.
        You may query only the tables below.

        {table_info}

        Given the user question, produce ONE valid MySQL statement that answers it.
        If the question is related to the patient itself then use its patient id.
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

    cleaned = clean_query(query)
    try:
        result = sql_chain.invoke({"input": cleaned, "table_info": schema_info})
    except Exception:
        try:
            result = sql_chain.invoke({"query": cleaned, "table_info": schema_info})
        except Exception:
            result = sql_chain.run(cleaned)
    if hasattr(result, "content"):
        return result.content
    return str(result)

def sql_to_nl(question: str, rows: list | str) -> str:
    """Turn DB rows into a user-friendly sentence."""
    prompt = f"""
    The user asked: {question}
    The database returned: {rows}

    Please answer the user in natural language using the data above.
    Make it short and simple.
    """.strip()
    resp = llm.invoke(prompt)
    return resp.content if hasattr(resp, "content") else str(resp)