ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS review_email_delay INTEGER DEFAULT 2;
