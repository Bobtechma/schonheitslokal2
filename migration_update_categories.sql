-- Update Services
UPDATE services SET subcategory = 'Gesichtsbehandlungen' WHERE category = 'service' AND (name ILIKE '%Gesicht%' OR name ILIKE '%Facial%' OR name ILIKE '%Reinigung%' OR name ILIKE '%Akne%');
UPDATE services SET subcategory = 'Körperbehandlungen' WHERE category = 'service' AND (name ILIKE '%Körper%' OR name ILIKE '%Body%' OR name ILIKE '%Rücken%');
UPDATE services SET subcategory = 'Wimpern & Augenbrauen' WHERE category = 'service' AND (name ILIKE '%Wimpern%' OR name ILIKE '%Brow%' OR name ILIKE '%Lash%' OR name ILIKE '%Augen%');
UPDATE services SET subcategory = 'Microneedling' WHERE category = 'service' AND (name ILIKE '%Needling%' OR name ILIKE '%Mese%');
UPDATE services SET subcategory = 'Massage' WHERE category = 'service' AND (name ILIKE '%Massage%');
UPDATE services SET subcategory = 'Anti-Aging' WHERE category = 'service' AND (name ILIKE '%Anti-Aging%' OR name ILIKE '%Botox%' OR name ILIKE '%Hyaluron%');

-- Update Products
UPDATE services SET subcategory = 'Gesichtspflege' WHERE category = 'product' AND (name ILIKE '%Cream%' OR name ILIKE '%Creme%' OR name ILIKE '%Serum%' OR name ILIKE '%Face%' OR name ILIKE '%Gesicht%' OR name ILIKE '%Cleanser%');
UPDATE services SET subcategory = 'Körperpflege' WHERE category = 'product' AND (name ILIKE '%Lotion%' OR name ILIKE '%Body%' OR name ILIKE '%Körper%' OR name ILIKE '%Hand%');
UPDATE services SET subcategory = 'Sets' WHERE category = 'product' AND (name ILIKE '%Set%' OR name ILIKE '%Kit%');
UPDATE services SET subcategory = 'Gutscheine' WHERE category = 'product' AND (name ILIKE '%Gutschein%' OR name ILIKE '%Voucher%');

-- Set defaults for anything missed
UPDATE services SET subcategory = 'Andere Services' WHERE category = 'service' AND (subcategory IS NULL OR subcategory = 'Gerill');
UPDATE services SET subcategory = 'Andere Produkte' WHERE category = 'product' AND (subcategory IS NULL OR subcategory = 'Gerill');
