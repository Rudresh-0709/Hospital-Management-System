from ...model_loader import llms


def detect_sql_topic(user_input: str) -> str:
    system_prompt = (
        "Classify the following SQL-related hospital query into one of the topics:\n"
        "- 'appointments'\n"
        "- 'doctors'\n"
        "- 'personal_info'\n"
        "- 'prescriptions'\n"
        "- 'admissions'\n"
        "Only return one word (the topic)."
    )
    user_prompt = f"User_input: {user_input}"

    llm = llms["groq_fast"]
    response = llm.invoke(system_prompt + "\n" + user_prompt)
    raw = response.content if hasattr(response, "content") else str(response)
    return raw.strip().lower().replace('"', '').replace("'", "")
