from tool_nodes.doctor_tool import sql_connector

def get_patient_details(patient_id:int)-> dict:
    conn=sql_connector()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("SELECT name, email, contact FROM patients WHERE id = %s",(patient_id))
    result=cursor.fetchone()

    cursor.close()
    conn.close()

    return result if result else {}