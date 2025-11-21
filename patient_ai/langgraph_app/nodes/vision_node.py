
import os
import openai
import base64
import requests
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from PIL import Image
from langchain.prompts import PromptTemplate
import torch
from ..state import HMAIState
from copy import deepcopy


openai.api_key = os.getenv("OPENAI_API_KEY")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def process_image(state:HMAIState)->HMAIState:
    s=deepcopy(state)
    
    image_base64 = s.image_base64
    
    if not image_base64 and s.image_path:
        image_base64 = encode_image(s.image_path)
        
    if not image_base64:
        s.pdf_query_input = "No image provided."
        return s

    message = HumanMessage(content=[
        {
            "type": "text",
            "text": "Please diagnose the condition shown in this medical image.",
        },
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_base64}",
            },
        },
    ])
    llm=ChatOpenAI(model="gpt-4o", temperature=0)
    response=llm.invoke([message])
    s.pdf_query_input=response.content
    return s

