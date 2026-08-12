-- Check the get_available_slots function definition
SELECT pg_get_functiondef(oid) as func_def
FROM pg_proc 
WHERE proname = 'get_available_slots';