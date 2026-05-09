/**
 * ============================================================
 *  Hospital Management System — Demo Data Seed Script
 * ============================================================
 *  Run:  node seed_data.js
 *
 *  This script inserts realistic dummy data into every major
 *  table in the `hospital` MySQL database.  It does NOT create
 *  new API endpoints — it talks directly to the DB.
 *
 *  Tables seeded (in dependency order):
 *    1. doctors
 *    2. rooms
 *    3. patients  (+ full_name generated column)
 *    4. emergency
 *    5. admit     (links patients → doctors → rooms)
 *    6. badge     (3 per admission)
 *    7. nurses
 *    8. nurse allocation  (UPDATE admit SET nurse_id)
 *    9. appointments
 *   10. hospital_staff
 *   11. equipments
 *   12. medicine_products
 *   13. consumer_transactions
 *   14. notifications
 *   15. diagnosis
 *   16. prescriptions + prescription_medicines
 * ============================================================
 */

require('dotenv').config();
const mysql = require('mysql2');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS,
    database: 'hospital',
});

con.connect((err) => {
    if (err) {
        console.error('❌ DB connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to hospital database.\n');
    seedAll();
});

// ── Promisified query helper ────────────────────────────────
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

// ── Main orchestrator ───────────────────────────────────────
async function seedAll() {
    try {
        console.log('🌱 Seeding demo data...\n');

        await seedDoctors();
        await seedRooms();
        const patientIds = await seedPatients();
        await seedEmergencyContacts(patientIds);
        const admitRows = await seedAdmissions(patientIds);
        await seedBadges(admitRows);
        const nurseIds = await seedNurses();
        await allocateNursesToAdmissions(admitRows, nurseIds);
        await seedAppointments();
        await seedStaff();
        await seedEquipments();
        const medicineIds = await seedMedicineProducts();
        await seedConsumerTransactions(medicineIds);
        await seedNotifications(admitRows);
        const diagnosisIds = await seedDiagnoses(admitRows);
        await seedPrescriptions(diagnosisIds, patientIds);

        console.log('\n🎉 All demo data seeded successfully!');
    } catch (err) {
        console.error('❌ Seed error:', err);
    } finally {
        con.end();
    }
}

// ── 1. Doctors ──────────────────────────────────────────────
async function seedDoctors() {
    const doctors = [
        ['Dr. Aisha Patel',    'Cardiology',     '08:00', '16:00', 'aisha123'],
        ['Dr. Rohan Mehta',    'Neurology',      '09:00', '17:00', 'rohan123'],
        ['Dr. Sneha Kapoor',   'Orthopedics',    '07:00', '15:00', 'sneha123'],
        ['Dr. Vikram Singh',   'Pediatrics',     '10:00', '18:00', 'vikram123'],
        ['Dr. Priya Sharma',   'Dermatology',    '08:30', '16:30', 'priya123'],
        ['Dr. Arjun Reddy',    'General Surgery','07:30', '15:30', 'arjun123'],
        ['Dr. Meera Nair',     'Ophthalmology',  '09:30', '17:30', 'meera123'],
        ['Dr. Karan Desai',    'ENT',            '08:00', '16:00', 'karan123'],
    ];

    for (const d of doctors) {
        await query(
            `INSERT INTO doctors (doctor_name, speciality, doctor_in, doctor_out, doctor_password)
             VALUES (?, ?, ?, ?, ?)`,
            d,
        );
    }
    console.log(`  ✔ Inserted ${doctors.length} doctors`);
}

// ── 2. Rooms ────────────────────────────────────────────────
async function seedRooms() {
    const wards = ['General', 'ICU', 'Private'];
    let count = 0;

    for (const ward of wards) {
        for (let r = 1; r <= 5; r++) {
            const roomNum = ward === 'General' ? 100 + r : ward === 'ICU' ? 200 + r : 300 + r;
            await query(
                `INSERT INTO rooms (room_number, ward_preference, is_occupied)
                 VALUES (?, ?, 0)
                 ON DUPLICATE KEY UPDATE room_number = room_number`,
                [roomNum, ward],
            );
            count++;
        }
    }
    console.log(`  ✔ Ensured ${count} rooms exist`);
}

// ── 3. Patients ─────────────────────────────────────────────
async function seedPatients() {
    const patients = [
        ['Aarav',   'Joshi',    '1990-03-15', 'Male',   '9876543210', 'aarav.joshi@mail.com',    '12 MG Road, Mumbai',    'patient1'],
        ['Diya',    'Verma',    '1985-07-22', 'Female', '9876543211', 'diya.verma@mail.com',     '34 Park Street, Delhi', 'patient2'],
        ['Kabir',   'Malhotra', '2000-11-05', 'Male',   '9876543212', 'kabir.m@mail.com',        '56 Lake View, Pune',    'patient3'],
        ['Ishaan',  'Gupta',    '1978-01-30', 'Male',   '9876543213', 'ishaan.g@mail.com',       '78 Hill Road, Jaipur',  'patient4'],
        ['Ananya',  'Das',      '1995-09-10', 'Female', '9876543214', 'ananya.das@mail.com',     '90 River Lane, Kolkata','patient5'],
        ['Riya',    'Chauhan',  '2002-04-18', 'Female', '9876543215', 'riya.c@mail.com',         '23 Fort Road, Ahmedabad','patient6'],
        ['Veer',    'Thakur',   '1988-12-01', 'Male',   '9876543216', 'veer.t@mail.com',         '45 Station Rd, Lucknow','patient7'],
        ['Saanvi',  'Iyer',     '1993-06-25', 'Female', '9876543217', 'saanvi.iyer@mail.com',    '67 Temple St, Chennai', 'patient8'],
        ['Aryan',   'Bhatia',   '1970-08-14', 'Male',   '9876543218', 'aryan.b@mail.com',        '89 Green Park, Bangalore','patient9'],
        ['Myra',    'Saxena',   '2005-02-28', 'Female', '9876543219', 'myra.s@mail.com',         '11 Civil Lines, Nagpur','patient10'],
    ];

    const ids = [];
    for (const p of patients) {
        const result = await query(
            `INSERT INTO patients (first_name, last_name, dob, gender, contact_number, email, address, password)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            p,
        );
        ids.push(result.insertId);
    }
    console.log(`  ✔ Inserted ${patients.length} patients`);
    return ids;
}

// ── 4. Emergency contacts ───────────────────────────────────
async function seedEmergencyContacts(patientIds) {
    const contacts = [
        ['Suresh Joshi',    'Father',  '9800000001'],
        ['Meena Verma',     'Mother',  '9800000002'],
        ['Raj Malhotra',    'Brother', '9800000003'],
        ['Sunita Gupta',    'Wife',    '9800000004'],
        ['Amit Das',        'Husband', '9800000005'],
        ['Neha Chauhan',    'Sister',  '9800000006'],
        ['Pooja Thakur',    'Mother',  '9800000007'],
        ['Lakshmi Iyer',    'Mother',  '9800000008'],
        ['Rekha Bhatia',    'Wife',    '9800000009'],
        ['Deepak Saxena',   'Father',  '9800000010'],
    ];

    for (let i = 0; i < patientIds.length; i++) {
        await query(
            `INSERT INTO emergency (patient_id, emergency_name, relationship, emergency_contact)
             VALUES (?, ?, ?, ?)`,
            [patientIds[i], ...contacts[i]],
        );
    }
    console.log(`  ✔ Inserted ${contacts.length} emergency contacts`);
}

// ── 5. Admissions ───────────────────────────────────────────
async function seedAdmissions(patientIds) {
    // Fetch doctor names & available rooms
    const doctors = await query('SELECT doctor_name FROM doctors');
    const rooms = await query('SELECT room_number, ward_preference FROM rooms WHERE is_occupied = 0 LIMIT 10');

    const reasons = [
        'Chest pain observation',
        'Migraine evaluation',
        'Fractured tibia',
        'High fever – pediatric',
        'Skin allergy reaction',
        'Appendectomy prep',
        'Cataract pre-op',
        'Tonsillitis',
        'Routine cardiac checkup',
        'Severe dehydration',
    ];

    const admitRows = [];
    const count = Math.min(patientIds.length, rooms.length);

    for (let i = 0; i < count; i++) {
        const docName = doctors[i % doctors.length].doctor_name;
        const room = rooms[i];
        const result = await query(
            `INSERT INTO admit (patient_id, reason_for_admission, doctor_assigned, ward_preference, room_number)
             VALUES (?, ?, ?, ?, ?)`,
            [patientIds[i], reasons[i], docName, room.ward_preference, room.room_number],
        );
        // Mark room occupied
        await query(
            `UPDATE rooms SET is_occupied = 1 WHERE room_number = ? AND ward_preference = ?`,
            [room.room_number, room.ward_preference],
        );
        admitRows.push({
            admit_id: result.insertId,
            patient_id: patientIds[i],
            doctor_assigned: docName,
            room_number: room.room_number,
        });
    }
    console.log(`  ✔ Inserted ${count} admissions (rooms marked occupied)`);
    return admitRows;
}

// ── 6. Badges (3 per admission) ─────────────────────────────
async function seedBadges(admitRows) {
    let count = 0;
    for (const row of admitRows) {
        for (let b = 0; b < 3; b++) {
            await query('INSERT INTO badge (admit_id) VALUES (?)', [row.admit_id]);
            count++;
        }
    }
    console.log(`  ✔ Inserted ${count} visitor badges`);
}

// ── 7. Nurses ───────────────────────────────────────────────
async function seedNurses() {
    const nurses = [
        ['Suman Roy',     'suman.r@hospital.com',  '9700000001', 'Critical Care',     'Head Nurse',      'Morning', 'ICU'],
        ['Kavita Rao',    'kavita.r@hospital.com', '9700000002', 'Pediatric Care',    'Assistant Nurse', 'Evening', 'General'],
        ['Nisha Tiwari',  'nisha.t@hospital.com',  '9700000003', 'Surgical',          'Head Nurse',      'Night',   'Private'],
        ['Anjali Mishra', 'anjali.m@hospital.com', '9700000004', 'General',           'Trainee Nurse',   'Morning', 'General'],
        ['Pooja Bhatt',   'pooja.b@hospital.com',  '9700000005', 'Cardiac Care',      'Assistant Nurse', 'Evening', 'ICU'],
        ['Rekha Pillai',  'rekha.p@hospital.com',  '9700000006', 'Orthopedic',        'Head Nurse',      'Morning', 'Private'],
        ['Deepa Nair',    'deepa.n@hospital.com',  '9700000007', 'Emergency',         'Assistant Nurse', 'Night',   'General'],
        ['Sunita Yadav',  'sunita.y@hospital.com', '9700000008', 'Neonatal',          'Trainee Nurse',   'Morning', 'ICU'],
    ];

    const ids = [];
    for (const n of nurses) {
        const result = await query(
            `INSERT INTO nurses (name, email, phone_number, specialization, role, shift, ward_assigned, available)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            n,
        );
        ids.push(result.insertId);
    }
    console.log(`  ✔ Inserted ${nurses.length} nurses`);
    return ids;
}

// ── 8. Allocate nurses to admissions ────────────────────────
async function allocateNursesToAdmissions(admitRows, nurseIds) {
    const count = Math.min(admitRows.length, nurseIds.length);
    for (let i = 0; i < count; i++) {
        await query('UPDATE admit SET nurse_id = ? WHERE admit_id = ?', [nurseIds[i], admitRows[i].admit_id]);
        await query('UPDATE nurses SET available = 0 WHERE nurse_id = ?', [nurseIds[i]]);
    }
    console.log(`  ✔ Allocated ${count} nurses to patients`);
}

// ── 9. Appointments ─────────────────────────────────────────
async function seedAppointments() {
    const doctors = await query('SELECT doctor_name FROM doctors');

    const appts = [
        ['Rahul Kumar',    'rahul.k@mail.com',   '9600000001', '2026-05-12', '10:00:00', 'Routine checkup'],
        ['Sita Devi',      'sita.d@mail.com',    '9600000002', '2026-05-13', '11:30:00', 'Knee pain consultation'],
        ['Manoj Pillai',   'manoj.p@mail.com',   '9600000003', '2026-05-14', '14:00:00', 'Skin rash evaluation'],
        ['Geeta Sharma',   'geeta.s@mail.com',   '9600000004', '2026-05-15', '09:00:00', 'Eye checkup'],
        ['Arun Nair',      'arun.n@mail.com',    '9600000005', '2026-05-16', '15:30:00', 'ENT consultation'],
        ['Priti Jain',     'priti.j@mail.com',   '9600000006', '2026-05-17', '10:30:00', 'Post-surgery follow-up'],
    ];

    for (let i = 0; i < appts.length; i++) {
        const docName = doctors[i % doctors.length].doctor_name;
        await query(
            `INSERT INTO appointments (appointee_name, appointee_email, appointee_contact, doctor_name, appointment_date, appointment_time, purpose, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [appts[i][0], appts[i][1], appts[i][2], docName, appts[i][3], appts[i][4], appts[i][5]],
        );
    }
    console.log(`  ✔ Inserted ${appts.length} appointments`);
}

// ── 10. Hospital Staff ──────────────────────────────────────
async function seedStaff() {
    const staff = [
        ['Ramesh',  'Kumar',    'Receptionist',   'Front Desk',   '9500000001', 'ramesh.k@hospital.com',  '2023-01-15', '10 Staff Quarters',    'Morning'],
        ['Sunil',   'Yadav',    'Pharmacist',     'Pharmacy',     '9500000002', 'sunil.y@hospital.com',   '2022-06-01', '11 Staff Quarters',    'Evening'],
        ['Geeta',   'Pandey',   'Lab Technician', 'Pathology',    '9500000003', 'geeta.p@hospital.com',   '2024-03-10', '12 Staff Quarters',    'Morning'],
        ['Manoj',   'Singh',    'Janitor',        'Maintenance',  '9500000004', 'manoj.s@hospital.com',   '2021-09-20', '13 Staff Quarters',    'Night'],
        ['Anita',   'Kulkarni', 'Accountant',     'Finance',      '9500000005', 'anita.k@hospital.com',   '2023-07-05', '14 Staff Quarters',    'Morning'],
        ['Vikash',  'Tiwari',   'Security Guard', 'Security',     '9500000006', 'vikash.t@hospital.com',  '2020-11-11', '15 Staff Quarters',    'Night'],
    ];

    for (const s of staff) {
        await query(
            `INSERT INTO hospital_staff (staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            s,
        );
    }
    console.log(`  ✔ Inserted ${staff.length} staff members`);
}

// ── 11. Equipments ──────────────────────────────────────────
async function seedEquipments() {
    const items = [
        ['Ventilator', 12],
        ['ECG Machine', 8],
        ['X-Ray Machine', 4],
        ['Defibrillator', 6],
        ['Infusion Pump', 20],
        ['Pulse Oximeter', 30],
        ['Surgical Light', 10],
        ['Wheelchair', 25],
        ['Hospital Bed', 50],
        ['Oxygen Cylinder', 40],
    ];

    for (const e of items) {
        await query('INSERT INTO equipments (equipment_name, count) VALUES (?, ?)', e);
    }
    console.log(`  ✔ Inserted ${items.length} equipment entries`);
}

// ── 12. Medicine Products ───────────────────────────────────
async function seedMedicineProducts() {
    // Schema: medicine_id, medicine_name, manufacturer, batch_number, expiry_date, price_per_unit, stock_quantity, description, supplier_name, contact_number
    const medicines = [
        ['Paracetamol 500mg',      'Sun Pharma',       'BP-2026-001', '2027-06-15', 5.00,  500, 'Analgesic & antipyretic tablet',       'MedSupply India',   '9400000001'],
        ['Amoxicillin 250mg',      'Cipla',            'BP-2026-002', '2027-03-20', 12.00, 300, 'Broad-spectrum antibiotic capsule',    'PharmaDist Co.',    '9400000002'],
        ['Ibuprofen 400mg',        'Dr. Reddys',       'BP-2026-003', '2027-08-10', 7.50,  400, 'NSAID for pain and inflammation',      'HealthLine Supply', '9400000003'],
        ['Metformin 500mg',        'Lupin',            'BP-2026-004', '2027-12-01', 3.00,  250, 'Oral antidiabetic medication',         'MedSupply India',   '9400000001'],
        ['Atorvastatin 10mg',      'Zydus Cadila',     'BP-2026-005', '2027-09-25', 8.50,  350, 'Cholesterol-lowering statin',          'PharmaDist Co.',    '9400000002'],
        ['Omeprazole 20mg',        'Torrent Pharma',   'BP-2026-006', '2027-07-18', 4.50,  600, 'Proton pump inhibitor capsule',        'HealthLine Supply', '9400000003'],
        ['Cetirizine 10mg',        'Mankind Pharma',   'BP-2026-007', '2028-01-30', 2.00,  800, 'Antihistamine for allergies',          'MedSupply India',   '9400000001'],
        ['Azithromycin 500mg',     'Alkem Labs',       'BP-2026-008', '2027-05-05', 25.00, 200, 'Macrolide antibiotic tablet',          'PharmaDist Co.',    '9400000002'],
        ['Diclofenac 50mg',        'Intas Pharma',     'BP-2026-009', '2027-11-12', 6.00,  450, 'NSAID for pain relief',                'HealthLine Supply', '9400000003'],
        ['Pantoprazole 40mg',      'Glenmark',         'BP-2026-010', '2028-02-28', 5.50,  550, 'Gastro-resistant tablet for acidity',  'MedSupply India',   '9400000001'],
    ];

    const ids = [];
    for (const m of medicines) {
        const result = await query(
            `INSERT INTO medicine_products (medicine_name, manufacturer, batch_number, expiry_date, price_per_unit, stock_quantity, description, supplier_name, contact_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            m,
        );
        ids.push(result.insertId);
    }
    console.log(`  ✔ Inserted ${medicines.length} medicine products`);
    return ids;
}

// ── 13. Consumer Transactions ───────────────────────────────
async function seedConsumerTransactions(medicineIds) {
    // Schema: transaction_id, medicine_id (FK), quantity, total_cost, transaction_date, sold_to, contact_number, is_admitted, patient_id
    // We use the medicine IDs returned from seedMedicineProducts
    const txns = [
        // [medicineIdIndex, quantity, total_cost, sold_to, contact_number, is_admitted, patient_id_or_null]
        [0, 10, 50.00,  'Aarav Joshi',    '9876543210', 1, null],   // Paracetamol
        [1, 5,  60.00,  'Diya Verma',     '9876543211', 1, null],   // Amoxicillin
        [2, 8,  60.00,  'Kabir Malhotra', '9876543212', 1, null],   // Ibuprofen
        [3, 30, 90.00,  'Ishaan Gupta',   '9876543213', 1, null],   // Metformin
        [6, 15, 30.00,  'Ananya Das',     '9876543214', 1, null],   // Cetirizine
        [5, 20, 90.00,  'Riya Chauhan',   '9876543215', 1, null],   // Omeprazole
        [7, 3,  75.00,  'Veer Thakur',    '9876543216', 0, null],   // Azithromycin (walk-in)
        [8, 12, 72.00,  'Saanvi Iyer',    '9876543217', 0, null],   // Diclofenac (walk-in)
    ];

    for (const t of txns) {
        const medId = medicineIds[t[0]];
        await query(
            `INSERT INTO consumer_transactions (medicine_id, quantity, total_cost, sold_to, contact_number, is_admitted, patient_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [medId, t[1], t[2], t[3], t[4], t[5], t[6]],
        );
    }
    console.log(`  ✔ Inserted ${txns.length} consumer transactions`);
}

// ── 14. Notifications ───────────────────────────────────────
async function seedNotifications(admitRows) {
    const doctors = await query('SELECT doctor_id, doctor_name FROM doctors');
    const docMap = {};
    doctors.forEach((d) => { docMap[d.doctor_name] = d.doctor_id; });

    for (const row of admitRows) {
        const docId = docMap[row.doctor_assigned] || null;
        await query(
            `INSERT INTO notifications (doctor_id, patient_id, type, message, is_read, created_at, doctor_assigned)
             VALUES (?, ?, 'New Patient Admission', ?, 0, NOW(), ?)`,
            [docId, row.patient_id, `Patient ID ${row.patient_id} admitted to room ${row.room_number}.`, row.doctor_assigned],
        );
    }
    console.log(`  ✔ Inserted ${admitRows.length} notifications`);
}

// ── 15. Diagnoses ───────────────────────────────────────────
async function seedDiagnoses(admitRows) {
    const doctors = await query('SELECT doctor_id, doctor_name FROM doctors');
    const docMap = {};
    doctors.forEach((d) => { docMap[d.doctor_name] = d.doctor_id; });

    const diagnosisData = [
        ['Hypertension Stage 2',    'Severe',   'Headache, dizziness, chest tightness',      'Elevated BP readings consistently above 160/100 mmHg'],
        ['Acute Bronchitis',        'Moderate', 'Persistent cough, fever, fatigue',           'Inflamed bronchial tubes; chest X-ray clear'],
        ['Tibial Fracture',         'Severe',   'Swelling, inability to bear weight, pain',   'Displaced fracture of right tibia confirmed via X-ray'],
        ['Viral Fever',             'Mild',     'High temperature, body ache, sore throat',   'Likely viral; blood work normal'],
        ['Contact Dermatitis',      'Mild',     'Itching, redness, blistering on forearms',   'Allergic reaction to nickel jewelry'],
        ['Appendicitis',            'Severe',   'Abdominal pain, nausea, fever',              'Inflamed appendix; surgery recommended'],
    ];

    const ids = [];
    const count = Math.min(admitRows.length, diagnosisData.length);
    for (let i = 0; i < count; i++) {
        const row = admitRows[i];
        const docId = docMap[row.doctor_assigned] || 1;
        const d = diagnosisData[i];
        const result = await query(
            `INSERT INTO diagnosis
             (patient_id, doctor_id, patient_type, diagnosis_date, diagnosis_name, severity, symptoms, follow_up_date, diagnosis_details)
             VALUES (?, ?, 'admitted', CURDATE(), ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY), ?)`,
            [row.patient_id, docId, d[0], d[1], d[2], d[3]],
        );
        ids.push({ diagnosis_id: result.insertId, patient_id: row.patient_id });
    }
    console.log(`  ✔ Inserted ${count} diagnoses`);
    return ids;
}

// ── 16. Prescriptions + medicines ───────────────────────────
async function seedPrescriptions(diagnosisIds, patientIds) {
    const meds = [
        { name: 'Paracetamol 500mg',  dosage: '1 tablet',  time: 'After meals – 3 times daily' },
        { name: 'Amoxicillin 250mg',  dosage: '1 capsule', time: 'Before meals – 2 times daily' },
        { name: 'Ibuprofen 400mg',    dosage: '1 tablet',  time: 'After meals – as needed' },
        { name: 'Omeprazole 20mg',    dosage: '1 capsule', time: 'Before breakfast' },
        { name: 'Cetirizine 10mg',    dosage: '1 tablet',  time: 'At bedtime' },
        { name: 'Azithromycin 500mg', dosage: '1 tablet',  time: 'Once daily for 3 days' },
    ];

    let pCount = 0;
    for (let i = 0; i < diagnosisIds.length; i++) {
        const { diagnosis_id, patient_id } = diagnosisIds[i];
        const presResult = await query(
            'INSERT INTO prescriptions (diagnosis_id, patient_id) VALUES (?, ?)',
            [diagnosis_id, patient_id],
        );
        const prescription_id = presResult.insertId;

        // Add 2 medicines per prescription
        const med1 = meds[i % meds.length];
        const med2 = meds[(i + 1) % meds.length];
        for (const m of [med1, med2]) {
            await query(
                'INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, time_of_intake) VALUES (?, ?, ?, ?)',
                [prescription_id, m.name, m.dosage, m.time],
            );
        }
        pCount++;
    }
    console.log(`  ✔ Inserted ${pCount} prescriptions with medicines`);
}
