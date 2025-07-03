import os
import yaml
from dotenv import load_dotenv
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.vectorstores import FAISS
from langchain_community.utilities import SQLDatabase
from langchain_community.embeddings import HuggingFaceEmbeddings

config={}
llms={}
vector_store={}
sql_db={}


def load_config():
    global config
    with open("config.yaml","r") as f:
        config=yaml.safe_load(f)

def load_llms():
    global llms
    if "openai" in config["llm"]:
        openai_config=config["llm"]["openai"]
        openai_api_key=os.getenv(openai_config["api_key_env"])
        if not openai_api_key:
            print(f"Open AI API key not set ${openai_api_key}")
        llms["openai"] = ChatOpenAI(
            model=openai_config.get("model_name","gpt-3.5-turbo"),
            api_key=openai_api_key,
            temperature=openai_config.get("temperature",0.2)
            )
        print("OpenAI llm loaded successfully")

    if "groq" in config["llm"]:
        groq_config=config["llm"]["groq"]
        groq_api_key=os.getenv(groq_config["api_key_env"])
        if not groq_api_key:
            print(f"Groq AI API key not set ${groq_api_key}")
        llms["groq"]=ChatGroq(
           model=groq_config.get("model_name","lava-1.5"),
           api_key=groq_api_key,
           temperature=0.2
        )
        print("Groq AI loaded successfully")

def load_vector_store():
    global vector_store
    vector_store_config=config.get("vector_store",{})
    index_path=vector_store_config.get("index_path")
    embedding_model=vector_store_config.get("embedding_model")

    embedding=HuggingFaceEmbeddings(model_name=embedding_model)
    vector_store = FAISS.load_local(
        folder_path=vector_store_config.get("index_path"),
        embeddings=embedding
    )

def load_sql_db():
    global sql_db
    sql_db = SQLDatabase.from_uri(os.getenv(config["sql"]["uri_env"]))

def init_model():
    load_config()
    load_llms()
    load_vector_store()
    load_sql_db()