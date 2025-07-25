from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class HMAIState(BaseModel):
    user_input:Optional[str]=None
    intent:Optional[str]=None
    source:Optional[str]="text"
    image_base64:Optional[str]=None
    image_path:Optional[str]=None

    pdf_chunks:Optional[List[str]]=None
    pdf_query_input:Optional[str]=None
    vision_result:Optional[str]=None
    booking_result:Optional[str]=None
    final_response:Optional[str]=None
    last_sender:Optional[str]="user"

    patient_id:Optional[int]=None
    last_disease_topic:Optional[str]=None
    diagnosis_condition:Optional[str]=None
    appointment_date:Optional[str]=None
    appointment_time:Optional[str]=None

    extracted_entities:Optional[Dict[str, Any]] = None
    follow_up_required:Optional[bool] = False
    next_prompt:Optional[str]=None

    messages:Optional[List[Dict]]=[]
    booking_stage:Optional[str]=None
    available_doctors:Optional[List[str]]=None
    selected_doctor:Optional[str]=None
    available_slots:Optional[list[str]]=None
    selected_slot:Optional[str]=None
    sql_response:Optional[str]=None

    appointee_name:Optional[str]=None  
    appointee_email:Optional[str]=None
    appointee_contact:Optional[int]=None