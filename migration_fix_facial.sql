-- Migration to fix incorrect 'facial' category
-- Moves items currently in 'facial' category to 'Uncategorized' (NULL) so they can be properly categorized in the Admin Dashboard

UPDATE services
SET category = NULL
WHERE category = 'facial';
