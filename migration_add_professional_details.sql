-- Create professional_services table
CREATE TABLE IF NOT EXISTS professional_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(professional_id, service_id)
);

-- Create professional_schedule table
CREATE TABLE IF NOT EXISTS professional_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(professional_id, day_of_week)
);

-- Enable RLS
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedule ENABLE ROW LEVEL SECURITY;

-- Policies for professional_services
CREATE POLICY "Public read access professional_services" ON professional_services
  FOR SELECT USING (true);
  
CREATE POLICY "Admin full access professional_services" ON professional_services
  FOR ALL USING (auth.role() = 'authenticated'); -- Assuming authenticated users are admins for now or refining later

-- Policies for professional_schedule
CREATE POLICY "Public read access professional_schedule" ON professional_schedule
  FOR SELECT USING (true);
  
CREATE POLICY "Admin full access professional_schedule" ON professional_schedule
  FOR ALL USING (auth.role() = 'authenticated');
