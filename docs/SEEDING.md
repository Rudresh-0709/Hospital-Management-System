# Doctor Seeding (Local Development Only)

This project now includes a **developer-only** doctor seeding endpoint that reuses the same doctor creation logic used by:

- `POST /new_doctor` (legacy admin form submit)
- `POST /api/admin/newdoctor` (API used by migrated admin UI)

It inserts records into the `doctors` table with these fields:

- `doctor_name`
- `speciality`
- `doctor_in`
- `doctor_out`
- `doctor_password`

## Safety Controls

Seeding is disabled by default and is not available in production.

The endpoint is enabled only when **all** are true:

1. `ENABLE_DOCTOR_SEEDING=true`
2. `SEED_TOKEN` is set
3. `NODE_ENV` is not `production`

If these are not satisfied, `POST /api/admin/seed/doctors` returns `404`.

## Run Locally

1. Set environment variables before starting the server:

```bash
export ENABLE_DOCTOR_SEEDING=true
export SEED_TOKEN=local-seed-token
export NODE_ENV=development
```

2. Start the app.

3. Call the seed endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/seed/doctors \
  -H "Content-Type: application/json" \
  -H "x-seed-token: local-seed-token" \
  -d '{}'
```

This seeds 20 realistic dummy doctors. You can also pass a custom list:

```json
{
  "doctors": [
    {
      "doctor_name": "Dr. Example",
      "speciality": "Cardiology",
      "doctor_in": "09:00",
      "doctor_out": "17:00",
      "doctor_password": "Example#2026"
    }
  ]
}
```

## Password behavior

- For the built-in default list, set `DEV_SEED_DOCTOR_PASSWORD` and that password is used for all seeded doctors.
- For custom payload seeding, each doctor can include `doctor_password` directly in the request.
- If default list seeding is attempted without `DEV_SEED_DOCTOR_PASSWORD`, the endpoint returns `400`.
