-- First, update the constraint to allow duration to be 0 (since products don't have a duration)
DO $$
BEGIN
    ALTER TABLE services DROP CONSTRAINT IF EXISTS services_duration_minutes_check;
    ALTER TABLE services ADD CONSTRAINT services_duration_minutes_check CHECK (duration_minutes >= 0);
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if constraint doesn't exist or can't be changed
END $$;

-- Add demo products to the services table
INSERT INTO services (name, description, duration_minutes, price, category, active, display_order, created_at, updated_at)
VALUES 
  (
    'Revitalisierendes Serum', 
    'Hochkonzentriertes Serum für strahlende Haut. Reduziert feine Linien und verbessert die Hautstruktur.', 
    0, 
    85.00, 
    'product', 
    true, 
    10, 
    NOW(), 
    NOW()
  ),
  (
    'Tagescreme mit LSF 30', 
    'Feuchtigkeitsspendende Tagespflege mit integriertem Sonnenschutz. Schützt vor vorzeitiger Hautalterung.', 
    0, 
    65.00, 
    'product', 
    true, 
    11, 
    NOW(), 
    NOW()
  ),
  (
    'Haarmaske Repair & Shine', 
    'Intensive Pflege für strapaziertes Haar. Verleiht Glanz und Geschmeidigkeit bereits nach der ersten Anwendung.', 
    0, 
    45.00, 
    'product', 
    true, 
    12, 
    NOW(), 
    NOW()
  );
