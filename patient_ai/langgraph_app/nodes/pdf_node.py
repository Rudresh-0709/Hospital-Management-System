"""
PDF Node - Medical knowledge retrieval with conversation context.

This module provides functions to search medical PDFs using RAG,
incorporating conversation history for better context understanding.
"""

from patient_ai.tool_nodes.pdf_tool_node import medical_pdf_chain
from patient_ai.langgraph_app.nodes.chat_memory_node import format_conversation_context


def pdf_search_from_user(state):
    """
    Search medical PDFs based on user query, incorporating conversation context.

    This enables the AI to understand follow-up questions like:
    - "What about treatment options?" (after discussing a disease)
    - "Is it contagious?" (referring to previously mentioned condition)
    """
    # Build enhanced query with conversation context
    conversation_context = ""
    if state.messages:
        conversation_context = format_conversation_context(
            state.messages, max_messages=3
        )

    # Include previous diagnosis condition if available
    context_info = ""
    if state.diagnosis_condition:
        context_info = f"Patient's condition: {state.diagnosis_condition}"

    # Construct the enhanced query
    if conversation_context or context_info:
        enhanced_query = f"""Based on the following context:

{f'Previous conversation:{chr(10)}{conversation_context}' if conversation_context else ''}
{context_info}

Current question: {state.user_input}

Please provide relevant medical information."""
    else:
        enhanced_query = state.user_input

    qa = medical_pdf_chain()
    result = qa.invoke({"query": enhanced_query})

    # Add safety disclaimer for medical advice
    response = result["result"]
    if not any(
        disclaimer in response.lower()
        for disclaimer in ["consult", "doctor", "medical professional", "healthcare"]
    ):
        response += "\n\n⚠️ *This information is for educational purposes only. Please consult a healthcare professional for medical advice.*"

    state.final_response = response
    return state


def pdf_search_from_image(state):
    """
    Search medical PDFs based on image analysis results.

    Uses the vision result (pdf_query_input) to find relevant medical information.
    """
    query = state.pdf_query_input

    # Include any prior context
    if state.vision_result:
        enhanced_query = f"""Based on image analysis: {state.vision_result}

Additional context: {query}

Please provide relevant medical information and recommendations."""
    else:
        enhanced_query = query

    qa = medical_pdf_chain()
    result = qa.invoke({"query": enhanced_query})

    # Add safety disclaimer
    response = result["result"]
    if not any(
        disclaimer in response.lower()
        for disclaimer in ["consult", "doctor", "medical professional", "healthcare"]
    ):
        response += "\n\n⚠️ *This information is for educational purposes only. Please consult a healthcare professional for proper diagnosis.*"

    state.final_response = response
    return state
