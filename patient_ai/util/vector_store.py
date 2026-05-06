import os
import yaml
from functools import lru_cache
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import FAISS

# with open("config.yaml","r") as f:
#         config=yaml.safe_load(f)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
with open(os.path.join(root_dir, "config.yaml"), "r") as f:
    config = yaml.safe_load(f)


# ── Eagerly load the embedding model at import time ──────────────────────────
# This is the slowest part (~2-3s). Loading it once at startup means
# search_medical_knowledge() responds instantly on first call.
_embedding_model = None

def get_embeddings():
    global _embedding_model
    if _embedding_model is None:
        model_name = config["vector_store"]["embedding_model"]
        try:
            # Specify CPU device explicitly to avoid meta tensor issues with torch
            _embedding_model = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={"device": "cpu"}
            )
        except Exception as e:
            print(f"Warning: HuggingFace embedding initialization failed: {e}")
            print("Falling back to default initialization...")
            _embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    return _embedding_model


def _warmup_embeddings():
    """Pre-load the embedding model in a background thread at import time."""
    import threading
    def _load():
        get_embeddings()
    t = threading.Thread(target=_load, daemon=True)
    t.start()

_warmup_embeddings()


# ── FAISS operations ─────────────────────────────────────────────────────────

def ingest_pdf_to_faiss():
    pdf_folder = os.path.join(root_dir, config["vector_store"]["pdf_data_folder"])
    index_path = os.path.join(root_dir, config["vector_store"]["index_path"])

    all_docs = []
    print("Looking for PDFs in:", pdf_folder)
    for file_name in os.listdir(pdf_folder):
        loader = PyPDFLoader(os.path.join(pdf_folder, file_name))
        docs = loader.load()
        all_docs.extend(docs)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    text_chunks = splitter.split_documents(all_docs)

    embeddings = get_embeddings()
    vector_store = FAISS.from_documents(text_chunks, embeddings)
    vector_store.save_local(index_path)

    print(f"FAISS embeddings generated successfully at {index_path}")


@lru_cache(maxsize=1)
def load_faiss_vector_store():
    index_path = os.path.join(root_dir, config["vector_store"]["index_path"])
    embeddings = get_embeddings()
    return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)