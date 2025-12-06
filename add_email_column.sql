-- Add email column to clients table if it doesn't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS email text;

-- Create an index on email for faster lookups since we search by it
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Comment on column
COMMENT ON COLUMN public.clients.email IS 'Client email address';
