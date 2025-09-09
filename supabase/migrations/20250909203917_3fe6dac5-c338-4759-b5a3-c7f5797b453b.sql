-- Add unified premium column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_premium BOOLEAN NOT NULL DEFAULT false;

-- Create wallets table for Solana integration
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('seeker','employer')),
  address TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unified entitlements table
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('stripe','token')),
  active BOOLEAN NOT NULL DEFAULT false,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "wallets owner access" ON wallets FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS policies for entitlements
CREATE POLICY "entitlements owner read" ON entitlements FOR SELECT
USING (auth.uid() = user_id);

-- Only system/functions can write entitlements directly
CREATE POLICY "entitlements write via function only" ON entitlements FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- Create unified premium resolution view
CREATE OR REPLACE VIEW v_users_with_premium AS
SELECT u.id as user_id,
       EXISTS(SELECT 1 FROM entitlements e WHERE e.user_id = u.id AND e.active = true) as has_premium
FROM auth.users u;

-- Function to sync premium status to profiles table
CREATE OR REPLACE FUNCTION sync_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle both INSERT/UPDATE and DELETE cases
  IF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET has_premium = (
      SELECT EXISTS(SELECT 1 FROM entitlements WHERE user_id = OLD.user_id AND active = true)
    )
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSE
    UPDATE profiles 
    SET has_premium = (
      SELECT EXISTS(SELECT 1 FROM entitlements WHERE user_id = NEW.user_id AND active = true)
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync premium status after entitlement changes
CREATE TRIGGER sync_premium_after_entitlement_change
  AFTER INSERT OR UPDATE OR DELETE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION sync_premium_status();

-- Migrate existing Stripe subscribers to entitlements table
INSERT INTO entitlements (user_id, source, active, value, refreshed_at)
SELECT 
  user_id, 
  'stripe' as source,
  subscribed as active,
  jsonb_build_object(
    'subscription_tier', subscription_tier,
    'subscription_end', subscription_end,
    'stripe_customer_id', stripe_customer_id
  ) as value,
  updated_at as refreshed_at
FROM subscribers 
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update profiles.has_premium for existing users based on entitlements
UPDATE profiles 
SET has_premium = (
  SELECT EXISTS(SELECT 1 FROM entitlements WHERE user_id = profiles.id AND active = true)
);