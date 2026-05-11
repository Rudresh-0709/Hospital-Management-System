require('dotenv').config();
const mysql = require('mysql2');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS,
    database: 'hospital',
});

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

async function seedMoreData() {
    try {
        console.log('🌱 Seeding MORE demo data...\n');

        await seedMoreDoctors();
        const patientIds = await seedMorePatients();
        await seedMoreEmergencyContacts(patientIds);
        const admitRows = await seedMoreAdmissions(patientIds);
        const nurseIds = await seedMoreNurses();
        await allocateMoreNursesToAdmissions(admitRows, nurseIds);
        await seedMoreStaff();

        console.log('\n🎉 All additional demo data seeded successfully!');
    } catch (err) {
        console.error('❌ Seed error:', err);
    } finally {
        con.end();
    }
}

async function seedMoreDoctors() {
    const doctors = [
        ['Dr. Rajiv Menon',      'Cardiology',     '09:00', '17:00', 'rajiv123'],
        ['Dr. Anjali Kulkarni',  'Cardiology',     '10:00', '18:00', 'anjali123'],
        ['Dr. Sanjay Dutt',      'Neurology',      '08:00', '16:00', 'sanjay123'],
        ['Dr. Neha Sharma',      'Neurology',      '11:00', '19:00', 'neha123'],
        ['Dr. Amit Patel',       'Orthopedics',    '07:30', '15:30', 'amit123'],
        ['Dr. Ramesh Gupta',     'Orthopedics',    '09:30', '17:30', 'ramesh123'],
        ['Dr. Sunita Menon',     'Pediatrics',     '08:00', '16:00', 'sunita123'],
        ['Dr. Pankaj Tripathi',  'Pediatrics',     '10:30', '18:30', 'pankaj123'],
        ['Dr. Manish Kumar',     'Dermatology',    '09:00', '17:00', 'manish123'],
        ['Dr. Sonal Chauhan',    'Dermatology',    '12:00', '20:00', 'sonal123'],
        ['Dr. Vivek Oberoi',     'General Surgery','07:00', '15:00', 'vivek123'],
        ['Dr. Ritu Parna',       'General Surgery','13:00', '21:00', 'ritu123'],
        ['Dr. Aditya Roy',       'Ophthalmology',  '08:30', '16:30', 'aditya123'],
        ['Dr. Shruti Haasan',    'Ophthalmology',  '14:00', '22:00', 'shruti123'],
        ['Dr. Varun Dhawan',     'ENT',            '09:00', '17:00', 'varun123'],
        ['Dr. Alia Bhatt',       'ENT',            '10:00', '18:00', 'alia123'],
        ['Dr. Mohan Lal',        'Oncology',       '08:00', '16:00', 'mohan123'],
        ['Dr. Shreya Ghoshal',   'Oncology',       '09:00', '17:00', 'shreya123'],
        ['Dr. Arjit Singh',      'Psychiatry',     '11:00', '19:00', 'arjit123'],
        ['Dr. Neha Kakkar',      'Psychiatry',     '10:00', '18:00', 'neha123'],
    ];

    for (const d of doctors) {
        await query(
            `INSERT INTO doctors (doctor_name, speciality, doctor_in, doctor_out, doctor_password)
             VALUES (?, ?, ?, ?, ?)`,
            d,
        );
    }
    console.log(`  ✔ Inserted ${doctors.length} additional doctors`);
}

async function seedMorePatients() {
    const patients = [
        ['Ravi',     'Shastri',  '1965-05-27', 'Male',   '9876543301', 'ravi.s@mail.com',       '12 Cricket Lane, Mumbai', 'pass1'],
        ['Smriti',   'Mandhana', '1996-07-18', 'Female', '9876543302', 'smriti.m@mail.com',     '34 Sports St, Pune',      'pass2'],
        ['Virat',    'Kohli',    '1988-11-05', 'Male',   '9876543303', 'virat.k@mail.com',      '56 Kings Road, Delhi',    'pass3'],
        ['Mithali',  'Raj',      '1982-12-03', 'Female', '9876543304', 'mithali.r@mail.com',    '78 Queen Ave, Hyderabad', 'pass4'],
        ['Rohit',    'Sharma',   '1987-04-30', 'Male',   '9876543305', 'rohit.s@mail.com',      '90 Hitman Blvd, Mumbai',  'pass5'],
        ['Harman',   'Kaur',     '1989-03-08', 'Female', '9876543306', 'harman.k@mail.com',     '23 Punjab St, Moga',      'pass6'],
        ['Jasprit',  'Bumrah',   '1993-12-06', 'Male',   '9876543307', 'jasprit.b@mail.com',    '45 Yorker Lane, Ahmedabad','pass7'],
        ['Deepti',   'Sharma',   '1997-08-24', 'Female', '9876543308', 'deepti.s@mail.com',     '67 Spin Rd, Agra',        'pass8'],
        ['Hardik',   'Pandya',   '1993-10-11', 'Male',   '9876543309', 'hardik.p@mail.com',     '89 Allrounder St, Baroda', 'pass9'],
        ['Shafali',  'Verma',    '2004-01-28', 'Female', '9876543310', 'shafali.v@mail.com',    '11 Opener Ave, Rohtak',   'pass10'],
        ['KL',       'Rahul',    '1992-04-18', 'Male',   '9876543311', 'kl.rahul@mail.com',     '12 Keeper Lane, Mangalore','pass11'],
        ['Jemimah',  'Rodrigues','2000-09-05', 'Female', '9876543312', 'jemimah.r@mail.com',    '34 Bandra West, Mumbai',  'pass12'],
        ['Rishabh',  'Pant',     '1997-10-04', 'Male',   '9876543313', 'rishabh.p@mail.com',    '56 Roorkee Rd, Haridwar', 'pass13'],
        ['Poonam',   'Yadav',    '1991-08-24', 'Female', '9876543314', 'poonam.y@mail.com',     '78 Leggie St, Agra',      'pass14'],
        ['Shubman',  'Gill',     '1999-09-08', 'Male',   '9876543315', 'shubman.g@mail.com',    '90 Prince Ave, Fazilka',  'pass15'],
        ['Richa',    'Ghosh',    '2003-09-28', 'Female', '9876543316', 'richa.g@mail.com',      '23 Siliguri Rd, Bengal',  'pass16'],
        ['Suryakumar','Yadav',   '1990-09-14', 'Male',   '9876543317', 'surya.y@mail.com',      '45 Sky Blvd, Mumbai',     'pass17'],
        ['Radha',    'Yadav',    '2000-04-21', 'Female', '9876543318', 'radha.y@mail.com',      '67 Kandivali, Mumbai',    'pass18'],
        ['Ravindra', 'Jadeja',   '1988-12-06', 'Male',   '9876543319', 'ravindra.j@mail.com',   '89 Sir Rd, Jamnagar',     'pass19'],
        ['Renuka',   'Singh',    '1996-02-01', 'Female', '9876543320', 'renuka.s@mail.com',     '11 Swing St, Shimla',     'pass20'],
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
    console.log(`  ✔ Inserted ${patients.length} additional patients`);
    return ids;
}

async function seedMoreEmergencyContacts(patientIds) {
    const contacts = [
        ['Wife Shastri',    'Wife',    '9800000101'],
        ['Father Mandhana', 'Father',  '9800000102'],
        ['Wife Kohli',      'Wife',    '9800000103'],
        ['Mother Raj',      'Mother',  '9800000104'],
        ['Wife Sharma',     'Wife',    '9800000105'],
        ['Father Kaur',     'Father',  '9800000106'],
        ['Wife Bumrah',     'Wife',    '9800000107'],
        ['Brother Sharma',  'Brother', '9800000108'],
        ['Wife Pandya',     'Wife',    '9800000109'],
        ['Father Verma',    'Father',  '9800000110'],
        ['Wife Rahul',      'Wife',    '9800000111'],
        ['Mother Rodrigues','Mother',  '9800000112'],
        ['Sister Pant',     'Sister',  '9800000113'],
        ['Husband Yadav',   'Husband', '9800000114'],
        ['Father Gill',     'Father',  '9800000115'],
        ['Mother Ghosh',    'Mother',  '9800000116'],
        ['Wife Yadav',      'Wife',    '9800000117'],
        ['Sister Yadav',    'Sister',  '9800000118'],
        ['Wife Jadeja',     'Wife',    '9800000119'],
        ['Brother Singh',   'Brother', '9800000120'],
    ];

    for (let i = 0; i < patientIds.length; i++) {
        await query(
            `INSERT INTO emergency (patient_id, emergency_name, relationship, emergency_contact)
             VALUES (?, ?, ?, ?)`,
            [patientIds[i], ...contacts[i]],
        );
    }
    console.log(`  ✔ Inserted ${contacts.length} additional emergency contacts`);
}

async function seedMoreAdmissions(patientIds) {
    const doctors = await query('SELECT doctor_name FROM doctors');
    
    // Create more rooms if needed, or just insert dummy rooms without checking is_occupied strictly
    // to ensure we have enough space for the new admissions.
    const wards = ['General', 'ICU', 'Private'];
    for (let i = 0; i < 20; i++) {
        const rNum = 400 + i;
        const ward = wards[i % 3];
        await query(
            `INSERT INTO rooms (room_number, ward_preference, is_occupied)
             VALUES (?, ?, 0)
             ON DUPLICATE KEY UPDATE room_number = room_number`,
            [rNum, ward],
        );
    }

    const rooms = await query('SELECT room_number, ward_preference FROM rooms WHERE is_occupied = 0 LIMIT 20');

    const reasons = [
        'Knee injury', 'Viral infection', 'Appendicitis', 'Migraine', 'Fracture', 
        'Skin allergy', 'Eye infection', 'Throat pain', 'Fever', 'Chest pain',
        'Stomach ache', 'Back pain', 'Cough and Cold', 'Dental issue', 'Asthma',
        'Food poisoning', 'Anemia', 'Blood pressure', 'Diabetes check', 'Routine checkup'
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
    console.log(`  ✔ Inserted ${count} additional admissions`);
    return admitRows;
}

async function seedMoreNurses() {
    const nurses = [
        ['Preeti Zinta',  'preeti.z@hospital.com',  '9700000101', 'Critical Care',  'Head Nurse',      'Evening', 'ICU'],
        ['Rani Mukerji',  'rani.m@hospital.com',    '9700000102', 'Pediatric Care', 'Assistant Nurse', 'Night',   'General'],
        ['Kajol Devgn',   'kajol.d@hospital.com',   '9700000103', 'Surgical',       'Trainee Nurse',   'Morning', 'Private'],
        ['Madhuri Dixit', 'madhuri.d@hospital.com', '9700000104', 'General',        'Head Nurse',      'Evening', 'General'],
        ['Juhi Chawla',   'juhi.c@hospital.com',    '9700000105', 'Cardiac Care',   'Assistant Nurse', 'Night',   'ICU'],
        ['Karisma Kapoor','karisma.k@hospital.com', '9700000106', 'Orthopedic',     'Trainee Nurse',   'Morning', 'Private'],
        ['Shilpa Shetty', 'shilpa.s@hospital.com',  '9700000107', 'Emergency',      'Head Nurse',      'Evening', 'General'],
        ['Raveena Tandon','raveena.t@hospital.com', '9700000108', 'Neonatal',       'Assistant Nurse', 'Night',   'ICU'],
        ['Tabu Hashmi',   'tabu.h@hospital.com',    '9700000109', 'Critical Care',  'Trainee Nurse',   'Morning', 'Private'],
        ['Urmila Matondkar','urmila.m@hospital.com','9700000110', 'Pediatric Care', 'Head Nurse',      'Evening', 'General'],
        ['Manisha Koirala','manisha.k@hospital.com','9700000111', 'Surgical',       'Assistant Nurse', 'Night',   'ICU'],
        ['Pooja Bhatt',   'pooja.b2@hospital.com',  '9700000112', 'General',        'Trainee Nurse',   'Morning', 'Private'],
        ['Sonali Bendre', 'sonali.b@hospital.com',  '9700000113', 'Cardiac Care',   'Head Nurse',      'Evening', 'General'],
        ['Twinkle Khanna','twinkle.k@hospital.com', '9700000114', 'Orthopedic',     'Assistant Nurse', 'Night',   'ICU'],
        ['Sushmita Sen',  'sushmita.s@hospital.com','9700000115', 'Emergency',      'Trainee Nurse',   'Morning', 'Private'],
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
    console.log(`  ✔ Inserted ${nurses.length} additional nurses`);
    return ids;
}

async function allocateMoreNursesToAdmissions(admitRows, nurseIds) {
    const count = Math.min(admitRows.length, nurseIds.length);
    for (let i = 0; i < count; i++) {
        await query('UPDATE admit SET nurse_id = ? WHERE admit_id = ?', [nurseIds[i], admitRows[i].admit_id]);
        await query('UPDATE nurses SET available = 0 WHERE nurse_id = ?', [nurseIds[i]]);
    }
    console.log(`  ✔ Allocated ${count} additional nurses to patients`);
}

async function seedMoreStaff() {
    const staff = [
        ['Salman',  'Khan',     'Security Guard', 'Security',     '9500000101', 'salman.k@hospital.com',  '2021-01-15', '16 Staff Quarters',    'Morning'],
        ['Shahrukh','Khan',     'Pharmacist',     'Pharmacy',     '9500000102', 'shahrukh.k@hospital.com','2022-06-01', '17 Staff Quarters',    'Evening'],
        ['Aamir',   'Khan',     'Lab Technician', 'Pathology',    '9500000103', 'aamir.k@hospital.com',   '2024-03-10', '18 Staff Quarters',    'Night'],
        ['Akshay',  'Kumar',    'Janitor',        'Maintenance',  '9500000104', 'akshay.k@hospital.com',  '2021-09-20', '19 Staff Quarters',    'Morning'],
        ['Ajay',    'Devgn',    'Accountant',     'Finance',      '9500000105', 'ajay.d@hospital.com',    '2023-07-05', '20 Staff Quarters',    'Evening'],
        ['Hrithik', 'Roshan',   'Receptionist',   'Front Desk',   '9500000106', 'hrithik.r@hospital.com', '2020-11-11', '21 Staff Quarters',    'Night'],
        ['Ranbir',  'Kapoor',   'Security Guard', 'Security',     '9500000107', 'ranbir.k@hospital.com',  '2021-02-15', '22 Staff Quarters',    'Morning'],
        ['Ranveer', 'Singh',    'Pharmacist',     'Pharmacy',     '9500000108', 'ranveer.s@hospital.com', '2022-07-01', '23 Staff Quarters',    'Evening'],
        ['Varun',   'Dhawan',   'Lab Technician', 'Pathology',    '9500000109', 'varun.d2@hospital.com',  '2024-04-10', '24 Staff Quarters',    'Night'],
        ['Tiger',   'Shroff',   'Janitor',        'Maintenance',  '9500000110', 'tiger.s@hospital.com',   '2021-10-20', '25 Staff Quarters',    'Morning'],
        ['Ayushmann','Khurrana','Accountant',     'Finance',      '9500000111', 'ayushmann.k@hospital.com','2023-08-05','26 Staff Quarters',    'Evening'],
        ['Rajkummar','Rao',     'Receptionist',   'Front Desk',   '9500000112', 'rajkummar.r@hospital.com','2020-12-11','27 Staff Quarters',    'Night'],
        ['Kartik',  'Aaryan',   'Security Guard', 'Security',     '9500000113', 'kartik.a@hospital.com',  '2021-03-15', '28 Staff Quarters',    'Morning'],
        ['Vicky',   'Kaushal',  'Pharmacist',     'Pharmacy',     '9500000114', 'vicky.k@hospital.com',   '2022-08-01', '29 Staff Quarters',    'Evening'],
        ['Sushant', 'Rajput',   'Lab Technician', 'Pathology',    '9500000115', 'sushant.r@hospital.com', '2024-05-10', '30 Staff Quarters',    'Night'],
    ];

    for (const s of staff) {
        await query(
            `INSERT INTO hospital_staff (staff_first_name, staff_last_name, role, department, contact_number, email, hire_date, address, shift)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            s,
        );
    }
    console.log(`  ✔ Inserted ${staff.length} additional staff members`);
}

con.connect((err) => {
    if (err) {
        console.error('❌ DB connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to hospital database.\n');
    seedMoreData();
});
