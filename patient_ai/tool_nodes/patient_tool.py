from .doctor_tool import sql_connector

def get_patient_details(patient_id:int)-> dict:
    conn=sql_connector()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("SELECT first_name, last_name, email, contact_number FROM patients WHERE patient_id = %s",(patient_id,))
    result=cursor.fetchone()

    cursor.close()
    conn.close()

    return result if result else {}