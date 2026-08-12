-- Add payment fields to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('credit_card', 'twint', 'bank_transfer', 'pickup')),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add comment to columns
COMMENT ON COLUMN appointments.payment_method IS 'Method used for payment: credit_card, twint, bank_transfer, or pickup';
COMMENT ON COLUMN appointments.payment_status IS 'Status of the payment: pending, paid, or failed';
COMMENT ON COLUMN appointments.stripe_payment_intent_id IS 'Stripe Payment Intent ID for credit card payments';
