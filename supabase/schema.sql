-- Booking Agent — Supabase Schema
-- Run this in the Supabase SQL editor or via psql

-- Calls table: one row per inbound VAPI call
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id TEXT UNIQUE NOT NULL,
  caller_number TEXT,
  duration_seconds INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('booked', 'no_answer', 'voicemail', 'declined', 'failed')),
  recording_url TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table: one row per successful booking
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id TEXT REFERENCES calls(vapi_call_id) ON DELETE SET NULL,
  caller_name TEXT NOT NULL,
  caller_email TEXT,
  caller_phone TEXT,
  service_type TEXT,
  booked_at TIMESTAMPTZ NOT NULL,
  cal_event_id TEXT,
  cal_confirmed BOOLEAN DEFAULT false,
  owner_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_appointments_booked_at ON appointments(booked_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_owner_notified ON appointments(owner_notified);

-- Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Owner policy: authenticated users can read all (owner has service_role key)
CREATE POLICY "Owner can read all calls"
  ON calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owner can read all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true);

-- Sample data for development
INSERT INTO calls (vapi_call_id, caller_number, duration_seconds, outcome) VALUES
  ('call_test_001', '+61412345678', 145, 'booked'),
  ('call_test_002', '+61423456789', 67, 'no_answer'),
  ('call_test_003', '+61434567890', 203, 'voicemail');

INSERT INTO appointments (vapi_call_id, caller_name, caller_email, caller_phone, service_type, booked_at, cal_confirmed, owner_notified) VALUES
  ('call_test_001', 'Jane Smith', 'jane@example.com', '+61412345678', 'Discovery Call', NOW() + INTERVAL '2 days', true, true);
