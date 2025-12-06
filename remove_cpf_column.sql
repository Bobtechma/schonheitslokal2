-- Remove CPF column from clients table
ALTER TABLE clients DROP COLUMN IF EXISTS cpf;
