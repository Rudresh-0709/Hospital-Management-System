from typing import Optional, List, Dict
from pydantic import BaseModel

class HMAIState(BaseModel):
    user_input:Optional[str]=None
    intent:Optional[str]=None
    image_base64:Optional[str]=None

    pdf_chunks:Optional[List[str]]=None
    vision_result:Optional[str]=None
    booking_result:Optional[str]=None
    final_response:Optional[str]=None

    patient_id:Optional[int]
    last_disease_topic:Optional[str]=None
    diagnosis_condition:Optional[str]=None

    extracted_entities:Optional[Dict[str, any]] = None
    follow_up_required:Optional[bool] = False
    next_prompt:Optional[str]=None

    messages:Optional[List[Dict]]=[]
    booking_stage:Optional[str]
    available_doctors:Optional[List[str]]
    selected_doctor:Optional[str]
    available_slots:Optional[list[str]]
    selected_slot:Optional[str]