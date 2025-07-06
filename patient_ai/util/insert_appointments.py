import mysql.connector
from tool_nodes.doctor_tool import sql_connector

def insert_appointment(name,email,contact,doctor_name,appointment_date,appointment_time,purpose,status="Scheduled"):
    conn=sql_connector()
    cursor=conn.cursor()
    cursor.execute("""
        INSERT INTO appointments
        (appointee_name, appointee_contact, appointee_email, doctor_name, appointment_date, appointment_time, purpose, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """,(name,contact,email,doctor_name,appointment_date,appointment_time,purpose,status))
    conn.commit()
    cursor.close()
    conn.close()

