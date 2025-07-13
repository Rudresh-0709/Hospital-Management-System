from model_loader import load_config, load_llms, llms
from langchain_core.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from util.vector_store import load_faiss_vector_store

load_config()
load_llms()

def medical_pdf_chain():
    custom_prompt_template = """
        You are an AI medical assistant specializing in hospital management. Your role is to assist patients by providing symptom-based diagnoses and medical recommendations.

        ### User Query:
        Context: {context}
        Question: {question}

        ### Instructions:
        - Directly provide a clear and concise response.
        - Do NOT include any internal thought processes, reasoning steps, or `<think>` sections.
        - If symptoms are mentioned, provide a possible diagnosis based on medical knowledge.
        - If unsure, state that a doctor's consultation is required.

        Respond ONLY with the answer.
    """

    vector_store=load_faiss_vector_store()

    retriever = vector_store.as_retriever(search_kwargs={'k':3})

    prompt=PromptTemplate(
        template=custom_prompt_template,
        input_variables=["context","question"]
        )

    llm=llms["groq"]

    qa_chain=RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={
            "prompt":prompt
        }
    )
    return qa_chain