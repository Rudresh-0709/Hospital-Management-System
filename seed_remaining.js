/**
 * Seed the remaining tables that failed in the first run:
 *   - notifications
 *   - diagnosis
 *   - prescriptions + prescription_medicines
 */
require('dotenv').config();
const mysql = require('mysql2');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS,
    database: 'hospital',
});

function q(sql, p = []) {
    return new Promise((resolve, reject) => {
        con.query(sql, p, (err, res) => (err ? reject(err) : resolve(res)));
    });
}

(async () => {
    con.connect();
    console.log('Connected.\n');

    // ── Fetch existing admit rows & doctor map ──
    const admitRows = await q(
        'SELECT a.admit_id, a.patient_id, a.doctor_assigned, a.room_number FROM admit a WHERE discharge_date IS NULL'
    );
    const doctors = await q('SELECT doctor_id, doctor_name FROM doctors');
    const docMap = {};
    doctors.forEach((d) => { docMap[d.doctor_name] = d.doctor_id; });

    // ── 1. Notifications ────────────────────────
    for (const row of admitRows) {
        const docId = docMap[row.doctor_assigned] || null;
        await q(
            `INSERT INTO notifications (doctor_id, patient_id, type, message, is_read, created_at, doctor_assigned)
             VALUES (?, ?, 'New Patient Admission', ?, 0, NOW(), ?)`,
            [docId, row.patient_id, `Patient ID ${row.patient_id} admitted to room ${row.room_number}.`, row.doctor_assigned]
        );
    }
    console.log(`  ✔ Inserted ${admitRows.length} notifications`);

    // ── 2. Diagnoses ────────────────────────────
    const diagnosisData = [
        ['Hypertension Stage 2',  'Severe',   'Headache, dizziness, chest tightness',         'Elevated BP readings consistently above 160/100 mmHg'],
        ['Acute Bronchitis',      'Moderate', 'Persistent cough, fever, fatigue',              'Inflamed bronchial tubes; chest X-ray clear'],
        ['Tibial Fracture',       'Severe',   'Swelling, inability to bear weight, pain',      'Displaced fracture of right tibia confirmed via X-ray'],
        ['Viral Fever',           'Mild',     'High temperature, body ache, sore throat',      'Likely viral; blood work normal'],
        ['Contact Dermatitis',    'Mild',     'Itching, redness, blistering on forearms',      'Allergic reaction to nickel jewelry'],
        ['Appendicitis',          'Severe',   'Abdominal pain, nausea, fever',                 'Inflamed appendix; surgery recommended'],
    ];

    const diagIds = [];
    const cnt = Math.min(admitRows.length, diagnosisData.length);
    for (let i = 0; i < cnt; i++) {
        const row = admitRows[i];
        const docId = docMap[row.doctor_assigned] || 1;
        const d = diagnosisData[i];
        const result = await q(
            `INSERT INTO diagnosis
             (patient_id, doctor_id, patient_type, diagnosis_date, diagnosis_name, severity, symptoms, follow_up_date, diagnosis_details)
             VALUES (?, ?, 'admitted', CURDATE(), ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY), ?)`,
            [row.patient_id, docId, d[0], d[1], d[2], d[3]]
        );
        diagIds.push({ diagnosis_id: result.insertId, patient_id: row.patient_id });
    }
    console.log(`  ✔ Inserted ${cnt} diagnoses`);

    // ── 3. Prescriptions + Medicines ────────────
    const rxMeds = [
        { name: 'Paracetamol 500mg',  dosage: '1 tablet',  time: 'After meals - 3 times daily' },
        { name: 'Amoxicillin 250mg',  dosage: '1 capsule', time: 'Before meals - 2 times daily' },
        { name: 'Ibuprofen 400mg',    dosage: '1 tablet',  time: 'After meals - as needed' },
        { name: 'Omeprazole 20mg',    dosage: '1 capsule', time: 'Before breakfast' },
        { name: 'Cetirizine 10mg',    dosage: '1 tablet',  time: 'At bedtime' },
        { name: 'Azithromycin 500mg', dosage: '1 tablet',  time: 'Once daily for 3 days' },
    ];

    for (let i = 0; i < diagIds.length; i++) {
        const { diagnosis_id, patient_id } = diagIds[i];
        const presResult = await q(
            'INSERT INTO prescriptions (diagnosis_id, patient_id) VALUES (?, ?)',
            [diagnosis_id, patient_id]
        );
        const prescription_id = presResult.insertId;

        const med1 = rxMeds[i % rxMeds.length];
        const med2 = rxMeds[(i + 1) % rxMeds.length];
        for (const m of [med1, med2]) {
            await q(
                'INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, time_of_intake) VALUES (?, ?, ?, ?)',
                [prescription_id, m.name, m.dosage, m.time]
            );
        }
    }
    console.log(`  ✔ Inserted ${diagIds.length} prescriptions with medicines`);

    console.log('\n🎉 All remaining data seeded!');
    con.end();
})().catch((e) => {
    console.error('❌ Error:', e);
    con.end();
});
