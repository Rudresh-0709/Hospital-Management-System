from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from langchain.schema import HumanMessage, AIMessage, SystemMessage, BaseMessage
from IPython.display import Image, display



load_dotenv()



class ChatState(TypedDict):
    messages: List[BaseMessage]

def generate_response(state: ChatState) -> ChatState:
    llm=ChatGroq(model="llama-3.3-70b-versatile")
    history=state["messages"]
    response=llm.invoke(history)
    history.append(response)
    return {"messages":history}

builder = StateGraph(ChatState)
builder.add_node("generate_response",generate_response)
builder.set_entry_point("generate_response")
builder.add_edge("generate_response",END)
chat_graph=builder.compile()
display(Image(chat_graph.get_graph().draw_mermaid_png))

if __name__ == "__main__":
    state={"messages": []}
    while True:
        user_input = input("You : ")
        if user_input.lower() == "exit":
            print("Goodbye !")
            break
        
        state["messages"].append(HumanMessage(content=user_input))
        state = chat_graph.invoke(state)

        bot_reply=state["messages"][-1].content
        print(bot_reply)