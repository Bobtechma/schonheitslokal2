-- Add professional_id to appointments table
ALTER TABLE appointments
ADD COLUMN professional_id UUID REFERENCES professionals(id);

-- Update RLS if necessary (appointments are usually visible to own user, or admins)
-- If there are existing RLS policies on appointments that restrict based on columns, they should stay fine.
-- But we might want policies for professionals to see their own appointments if they had logins, 
-- but for now professionals are just managed entities.
