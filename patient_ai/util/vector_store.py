import os
import yaml
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import FAISS

# with open("config.yaml","r") as f:
#         config=yaml.safe_load(f)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
with open(os.path.join(root_dir, "config.yaml"), "r") as f:
    config = yaml.safe_load(f)

def get_embeddings():
    model_name=config["vector_store"]["embedding_model"]
    return HuggingFaceEmbeddings(model_name=model_name)

def ingest_pdf_to_faiss():
    pdf_folder=os.path.join(root_dir, config["vector_store"]["pdf_data_folder"])
    index_path=os.path.join(root_dir, config["vector_store"]["index_path"])

    all_docs=[]
    print("Looking for PDFs in:", pdf_folder)
    for file_name in os.listdir(pdf_folder):
        loader=PyPDFLoader(os.path.join(pdf_folder,file_name))
        docs=loader.load()
        all_docs.extend(docs)
    splitter=RecursiveCharacterTextSplitter(chunk_size=1500,chunk_overlap=200)
    text_chunks=splitter.split_documents(all_docs)
    
    embeddings = get_embeddings()
    vecor_store = FAISS.from_documents(text_chunks,embeddings)
    vecor_store.save_local(index_path)

    print(f"FAISS embeddings generated successfully at ${index_path}")

def load_faiss_vector_store():
    index_path=os.path.join(root_dir, config["vector_store"]["index_path"])
    embeddings=get_embeddings()
    return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)