from ..state import HMAIState

def set_last_sender_user(state:HMAIState)->HMAIState:
    state.last_sender="user"
    return state

def set_last_sender_ai(state:HMAIState)->HMAIState:
    state.last_sender="ai"
    return state