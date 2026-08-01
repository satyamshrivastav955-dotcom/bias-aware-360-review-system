-- Bias-Aware 360° Performance Review — Supabase schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

create table if not exists employees (
  employee_id text primary key,
  name text not null,
  role text not null,
  raw_data jsonb not null
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  employee_id text references employees(employee_id),
  draft_json jsonb not null,
  final_json jsonb,
  status text not null default 'pending_approval',   -- pending_approval | approved | rejected
  reviewer text,
  approved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  report_id uuid references reports(id),
  actor text not null,
  action text not null,            -- generated | approved | rejected | edited
  diff jsonb,
  at timestamptz default now()
);
