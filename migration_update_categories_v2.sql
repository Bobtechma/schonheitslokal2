-- Force update subcategories based on keywords (Case Insensitive)

-- SERVICES
UPDATE services SET subcategory = 'Gesichtsbehandlungen' 
WHERE category = 'service' AND (
  name ILIKE '%Gesicht%' OR name ILIKE '%Facial%' OR name ILIKE '%Reinigung%' OR name ILIKE '%Akne%'
  OR name ILIKE '%Rosto%' OR name ILIKE '%Limpeza%'
);

UPDATE services SET subcategory = 'Körperbehandlungen' 
WHERE category = 'service' AND (
  name ILIKE '%Körper%' OR name ILIKE '%Body%' OR name ILIKE '%Rücken%'
  OR name ILIKE '%Corpo%' OR name ILIKE '%Costas%'
);

UPDATE services SET subcategory = 'Wimpern & Augenbrauen' 
WHERE category = 'service' AND (
  name ILIKE '%Wimpern%' OR name ILIKE '%Brow%' OR name ILIKE '%Lash%' OR name ILIKE '%Augen%'
  OR name ILIKE '%Sobrancelha%' OR name ILIKE '%Cílios%'
);

UPDATE services SET subcategory = 'Microneedling' 
WHERE category = 'service' AND (
  name ILIKE '%Needling%' OR name ILIKE '%Mese%' OR name ILIKE '%Microagulhamento%'
);

UPDATE services SET subcategory = 'Massage' 
WHERE category = 'service' AND (
  name ILIKE '%Massage%' OR name ILIKE '%Massagem%'
);

UPDATE services SET subcategory = 'Anti-Aging' 
WHERE category = 'service' AND (
  name ILIKE '%Anti-Aging%' OR name ILIKE '%Botox%' OR name ILIKE '%Hyaluron%' OR name ILIKE '%Preenchimento%'
);

-- PRODUCTS
UPDATE services SET subcategory = 'Gesichtspflege' 
WHERE category = 'product' AND (
  name ILIKE '%Cream%' OR name ILIKE '%Creme%' OR name ILIKE '%Serum%' OR name ILIKE '%Face%' OR name ILIKE '%Gesicht%' OR name ILIKE '%Cleanser%'
  OR name ILIKE '%Rosto%' OR name ILIKE '%Hidratante%'
);

UPDATE services SET subcategory = 'Körperpflege' 
WHERE category = 'product' AND (
  name ILIKE '%Lotion%' OR name ILIKE '%Body%' OR name ILIKE '%Körper%' OR name ILIKE '%Hand%'
  OR name ILIKE '%Corporal%'
);

UPDATE services SET subcategory = 'Sets' 
WHERE category = 'product' AND (
  name ILIKE '%Set%' OR name ILIKE '%Kit%'
);

UPDATE services SET subcategory = 'Gutscheine' 
WHERE category = 'product' AND (
  name ILIKE '%Gutschein%' OR name ILIKE '%Voucher%' OR name ILIKE '%Vale%'
);

-- Make sure strictly NULL values get a default if they didn't match above
-- But we want to avoid overwriting manually set ones if they exist, so only update if NULL
UPDATE services SET subcategory = 'Andere Services' WHERE category = 'service' AND subcategory IS NULL;
UPDATE services SET subcategory = 'Andere Produkte' WHERE category = 'product' AND subcategory IS NULL;
