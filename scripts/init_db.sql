-- Bias-Aware 360 Review System — reports table
-- Run against Postgres (Supabase/Railway/Neon free tier all work)

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  draft_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- pending_approval | approved | rejected
  reviewer TEXT,
  approved_at TIMESTAMP,
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_employee ON reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
