-- Add subscription and usage tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('free', 'premium', 'trialing')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS daily_ai_usage_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ai_usage_at TIMESTAMPTZ DEFAULT NOW();

-- Create a function to reset AI usage if it's a new day
CREATE OR REPLACE FUNCTION check_and_reset_ai_usage(user_uuid UUID)
RETURNS TABLE (
    status TEXT,
    usage_count INT,
    trial_expired BOOLEAN
) AS $$
DECLARE
    u_status TEXT;
    u_usage INT;
    u_last_usage TIMESTAMPTZ;
    u_trial_ends TIMESTAMPTZ;
    is_expired BOOLEAN := false;
BEGIN
    SELECT subscription_status, daily_ai_usage_count, last_ai_usage_at, trial_ends_at 
    INTO u_status, u_usage, u_last_usage, u_trial_ends
    FROM users 
    WHERE id = user_uuid;

    -- Check if trial has expired
    IF u_status = 'trialing' AND u_trial_ends < NOW() THEN
        UPDATE users SET subscription_status = 'free' WHERE id = user_uuid;
        u_status := 'free';
        is_expired := true;
    END IF;

    -- Reset count if it's a new day (UTC)
    IF u_last_usage::date < NOW()::date THEN
        UPDATE users 
        SET daily_ai_usage_count = 0, 
            last_ai_usage_at = NOW() 
        WHERE id = user_uuid;
        u_usage := 0;
    END IF;

    RETURN QUERY SELECT u_status, u_usage, is_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
