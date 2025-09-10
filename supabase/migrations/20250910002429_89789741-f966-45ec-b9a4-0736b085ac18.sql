-- Remove the problematic view that exposes auth.users
DROP VIEW IF EXISTS v_users_with_premium;

-- Fix the sync_premium_status function to include SET search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a secure function to check premium status instead of a view
CREATE OR REPLACE FUNCTION get_user_premium_status(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM entitlements WHERE user_id = _user_id AND active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;