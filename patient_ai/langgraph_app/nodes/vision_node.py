
import os
import openai
import base64
import requests
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from PIL import Image
from langchain.prompts import PromptTemplate
import torch


openai.api_key = os.getenv("OPENAI_API_KEY")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def process_image(state):
    image_path=state.image_path
    image = Image.open(image_path)

    image_base64=encode_image(image_path)

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
    state.pdf_query_input=response.content
    return state

# Example Usage
image_path = r"d:\DATA\Desktop\project1\patient_ai\data\images\image1.jpg"
query = "Diagnose the given picture."

response = process_image(image_path)

print(f"Diagnostic Response: {response}")