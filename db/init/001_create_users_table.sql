CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('resident', 'admin', 'verifier')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);