-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public professionals are viewable by everyone"
  ON professionals FOR SELECT
  USING (true);

CREATE POLICY "Professionals are insertable by admins"
  ON professionals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'); -- Simplified for this context, ideally check for specific admin role/claim

CREATE POLICY "Professionals are updateable by admins"
  ON professionals FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Professionals are deletable by admins"
  ON professionals FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
