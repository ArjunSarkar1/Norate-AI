-- SQL Script to Manually Confirm Existing Users in Supabase
-- Ran in Supabase SQL Editor to confirm users without email verification

-- Update all unconfirmed users to be confirmed
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE
    email_confirmed_at IS NULL
    OR confirmed_at IS NULL;

-- Optional: Check which users were updated
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All existing users have been confirmed and can now login!';
    RAISE NOTICE 'Users can now sign in with their email and password.';
END $$;
