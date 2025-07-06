from state import HMAIState
from model_loader import vector_store

def handle_pdf_query(state:HMAIState) -> HMAIState:
    query=state.user_input

    if not state.user_input:
        state.pdf_chunks=[]
        return state
    
    try:
        docs = vector_store.similarity_search(query,k=4)
        state.pdf_chunks=[doc.page_content for doc in docs]
    except Exception as e:
        print(f"PDF search error : ${e}")
        state.pdf_chunks=[]
    
    return state