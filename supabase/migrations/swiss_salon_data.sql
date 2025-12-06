-- Swiss Beauty Salon Data Migration
-- Update salon information for Schönheit & Wellness, Zurich

-- Update system settings with Swiss salon information
INSERT INTO system_settings (key, value, description) VALUES
('salon_name', 'Schönheit & Wellness', 'Name des Salons'),
('salon_address', 'Sternenstrasse 21, 8002 Zürich, Switzerland', 'Adresse des Salons'),
('salon_phone', '+41 79 896 71 88', 'Telefonnummer des Salons'),
('salon_email', 'info@schoenheit-wellness.ch', 'E-Mail-Adresse des Salons'),
('salon_website', 'https://www.schoenheit-wellness.ch', 'Website des Salons'),
('salon_description', 'Professionelle Beauty-Behandlungen und Massagen in Zürich. Erleben Sie Wellness und Schönheit auf höchstem Niveau.', 'Beschreibung des Salons'),
('currency', 'CHF', 'Währung'),
('timezone', 'Europe/Zurich', 'Zeitzone'),
('language', 'de', 'Sprache'),
('business_hours_monday', '10:00-19:00', 'Öffnungszeiten Montag'),
('business_hours_tuesday', '10:00-19:00', 'Öffnungszeiten Dienstag'),
('business_hours_wednesday', '10:00-19:00', 'Öffnungszeiten Mittwoch'),
('business_hours_thursday', '10:00-19:00', 'Öffnungszeiten Donnerstag'),
('business_hours_friday', '10:00-19:00', 'Öffnungszeiten Freitag'),
('business_hours_saturday', '10:00-16:00', 'Öffnungszeiten Samstag'),
('business_hours_sunday', 'geschlossen', 'Öffnungszeiten Sonntag')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Clear existing services
DELETE FROM services;
DELETE FROM business_hours;
DELETE FROM blocked_times;

-- Insert Swiss beauty salon services
INSERT INTO services (name, description, duration_minutes, price, category, active, display_order) VALUES
-- Gesichtsbehandlungen (Facial Treatments)
('Klassische Gesichtsbehandlung', 'Reinigung, Peeling, Ausreinigen, Maske und Pflege', 60, 120, 'Gesicht', true, 1),
('Luxus Gesichtsbehandlung', 'Intensive Anti-Aging Behandlung mit hochwertigen Produkten', 90, 180, 'Gesicht', true, 2),
('Hautstraffende Gesichtsbehandlung', 'Spezialbehandlung für festere und straffere Haut', 75, 150, 'Gesicht', true, 3),
('Anti-Aging Behandlung', 'Kollagen-boostende Behandlung gegen Falten', 90, 200, 'Gesicht', true, 4),

-- Körperbehandlungen (Body Treatments)
('Ganzkörpermassage', 'Entspannende Vollkörpermassage mit ätherischen Ölen', 60, 120, 'Massage', true, 5),
('Teilmassage Rücken', 'Spezielle Rückenmassage zur Spannungslösung', 30, 80, 'Massage', true, 6),
('Hot Stone Massage', 'Wärme- und Massage-Therapie mit heißen Steinen', 75, 150, 'Massage', true, 7),
('Aromatherapie Massage', 'Massage mit individuellen ätherischen Ölen', 60, 130, 'Massage', true, 8),

-- Kosmetische Behandlungen (Cosmetic Treatments)
('Maniküre', 'Nagelfeile, Handbad, Nagelhautpflege, Lack', 45, 60, 'Nägel', true, 9),
('Pediküre', 'Fußbad, Hornhautentfernung, Nagelpflege, Lack', 60, 70, 'Nägel', true, 10),
('Gel Maniküre', 'Langanhaltende Gel-Nagelbehandlung', 60, 90, 'Nägel', true, 11),
('Augenbrauenkorrektur', 'Formung und Korrektur der Augenbrauen', 15, 25, 'Gesicht', true, 12),
('Wimpern färben', 'Professionelle Wimpernfärbung', 20, 35, 'Gesicht', true, 13),

-- Entspannungsbehandlungen (Relaxation Treatments)
('Kopfmassage', 'Entspannende Kopf- und Nackenmassage', 30, 50, 'Massage', true, 14),
('Gesichtsmassage', 'Sanfte Massage für Gesicht und Dekolleté', 30, 60, 'Massage', true, 15),
('Handmassage', 'Pflegende Handmassage mit Creme', 20, 40, 'Massage', true, 16);

-- Insert business hours (Swiss schedule)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, '00:00', '00:00', true), -- Sunday (closed)
(1, '10:00', '19:00', false), -- Monday
(2, '10:00', '19:00', false), -- Tuesday
(3, '10:00', '19:00', false), -- Wednesday
(4, '10:00', '19:00', false), -- Thursday
(5, '10:00', '19:00', false), -- Friday
(6, '10:00', '16:00', false); -- Saturday

-- Insert some blocked times for lunch breaks
INSERT INTO blocked_times (date, start_time, end_time, reason) VALUES
('2025-11-20', '12:00', '13:00', 'Mittagspause'),
('2025-11-21', '12:00', '13:00', 'Mittagspause'),
('2025-11-22', '12:00', '13:00', 'Mittagspause');