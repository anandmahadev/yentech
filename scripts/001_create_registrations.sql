-- Create YENTECH registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT UNIQUE NOT NULL,
  campus_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  domain TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  why_choose_you TEXT,
  experience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on campus_id for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_registrations_campus_id ON public.registrations(campus_id);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration form)
CREATE POLICY "Allow public insert" ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to check if campus_id exists (for duplicate validation)
CREATE POLICY "Allow public select for duplicate check" ON public.registrations
  FOR SELECT
  USING (true);
