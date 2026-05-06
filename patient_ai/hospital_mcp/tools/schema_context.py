# hospital_mcp/tools/schema_context.py
# Write this once. Update it when your schema changes.

SCHEMA_CONTEXT = """
DATABASE SCHEMA WITH RELATIONSHIPS AND EXAMPLES
================================================

TABLE: patients
  patient_id        INT  PK  AUTO_INCREMENT
  first_name        VARCHAR
  last_name         VARCHAR
  dob               DATE     (date of birth)
  gender            VARCHAR
  contact_number    VARCHAR
  email             VARCHAR  (unique — used to link appointments)
  address           VARCHAR
  password          VARCHAR
  full_name         VARCHAR  (generated column: first_name + last_name)

TABLE: appointments
  appointment_id    INT  PK  AUTO_INCREMENT
  appointee_name    VARCHAR
  appointee_email   VARCHAR  (FK → patients.email)
  appointee_contact VARCHAR
  doctor_name       VARCHAR  (FK → doctors.doctor_name)
  appointment_date  DATE
  appointment_time  TIME
  purpose           VARCHAR
  status            VARCHAR  — values: 'Scheduled', 'Completed', 'Cancelled', 'Pending'
  NOTE: This table has NO patient_id column. Always filter by appointee_email.

TABLE: doctors
  doctor_id         INT  PK  AUTO_INCREMENT
  doctor_name       VARCHAR
  speciality        VARCHAR
  doctor_in         TIME     (working hours start)
  doctor_out        TIME     (working hours end)
  doctor_password   VARCHAR

TABLE: prescriptions
  prescription_id   INT  PK  AUTO_INCREMENT
  patient_id        INT  FK → patients.patient_id
  diagnosis_id      INT  FK → diagnosis.diagnosis_id
  appointment_id    INT  FK → appointments.appointment_id
  prescription_date DATETIME

TABLE: prescription_medicines
  prescription_id   INT  FK → prescriptions.prescription_id
  medicine_name     VARCHAR
  dosage            VARCHAR
  time_of_intake    VARCHAR  — e.g. 'Morning', 'After meals', 'Twice daily'

TABLE: admit  (admission history)
  admit_id              INT  PK  AUTO_INCREMENT
  patient_id            INT  FK → patients.patient_id
  reason_for_admission  VARCHAR
  doctor_assigned       VARCHAR  (FK → doctors.doctor_name)
  ward_preference       VARCHAR
  room_number           VARCHAR
  discharge_date        DATE     (NULL if still admitted)

COMMON JOIN PATTERNS:
- Patient prescriptions with medicines:
    SELECT pr.prescription_id, pr.prescription_date, pm.medicine_name, pm.dosage, pm.time_of_intake
    FROM prescriptions pr
    JOIN prescription_medicines pm ON pr.prescription_id = pm.prescription_id
    WHERE pr.patient_id = {patient_id}

- Patient appointments:
    SELECT * FROM appointments
    WHERE appointee_email = '{patient_email}'

- Appointments with doctor details:
    SELECT a.*, d.speciality
    FROM appointments a
    JOIN doctors d ON a.doctor_name = d.doctor_name
    WHERE a.appointee_email = '{patient_email}'

- Full prescription detail:
    SELECT pr.prescription_date, pm.medicine_name, pm.dosage, pm.time_of_intake
    FROM prescriptions pr
    JOIN prescription_medicines pm ON pr.prescription_id = pm.prescription_id
    WHERE pr.patient_id = {patient_id}
    ORDER BY pr.prescription_date DESC

- Patient admission history:
    SELECT admit_id, reason_for_admission, doctor_assigned, ward_preference, room_number, discharge_date
    FROM admit
    WHERE patient_id = {patient_id}

- Patient profile:
    SELECT first_name, last_name, dob, gender, contact_number, email, address
    FROM patients
    WHERE patient_id = {patient_id}
"""
