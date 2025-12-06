ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS review_email_sent BOOLEAN DEFAULT FALSE;
