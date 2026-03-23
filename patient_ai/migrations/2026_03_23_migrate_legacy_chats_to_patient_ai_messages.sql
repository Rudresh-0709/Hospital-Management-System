-- One-time migration: move legacy AI rows from `chats` into dedicated `patient_ai_messages`.
-- This migration keeps AI chat storage isolated from other chat features.

START TRANSACTION;

CREATE TABLE IF NOT EXISTS patient_ai_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    session_id VARCHAR(255),
    message TEXT,
    role VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional but recommended indexes for retrieval performance.
CREATE INDEX idx_patient_ai_messages_patient_session_time
    ON patient_ai_messages (patient_id, session_id, timestamp);
CREATE INDEX idx_patient_ai_messages_session_time
    ON patient_ai_messages (session_id, timestamp);

-- Copy only rows that match AI chat shape.
INSERT INTO patient_ai_messages (patient_id, session_id, message, role, timestamp)
SELECT c.patient_id, c.session_id, c.message, c.role, c.timestamp
FROM chats c
WHERE c.patient_id IS NOT NULL
  AND c.session_id IS NOT NULL
  AND c.message IS NOT NULL
  AND c.role IN ('user', 'ai', 'assistant')
  AND NOT EXISTS (
      SELECT 1
      FROM patient_ai_messages p
      WHERE p.patient_id = c.patient_id
        AND p.session_id = c.session_id
        AND p.role = c.role
        AND p.message = c.message
        AND p.timestamp = c.timestamp
  );

COMMIT;

-- After verification, you can archive or drop the legacy table manually if it is no longer needed.
-- DROP TABLE chats;
