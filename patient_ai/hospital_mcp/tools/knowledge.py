import os
from functools import lru_cache
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage


@lru_cache(maxsize=1)
def _get_vector_store():
    from patient_ai.util.vector_store import load_faiss_vector_store
    return load_faiss_vector_store()


def search_medical_knowledge(query: str) -> str:
    vs = _get_vector_store()
    docs = vs.similarity_search(query, k=3)
    if not docs:
        return "No relevant medical information found for this query."
    context_parts = []
    for i, doc in enumerate(docs, 1):
        context_parts.append(f"[Source {i}]\n{doc.page_content}")
    return "\n\n".join(context_parts)


def analyze_medical_image(image_base64: str) -> str:
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    message = HumanMessage(content=[
        {
            "type": "text",
            "text": (
                "You are a medical AI assistant. Analyze this medical image carefully. "
                "Describe what you observe, identify any visible conditions or abnormalities, "
                "and provide a preliminary assessment. Be specific and clinical."
            )
        },
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
        }
    ])
    response = llm.invoke([message])
    return response.content
