-- Migration 00020: Create subscriptions table for multi-tenancy monetization

CREATE TYPE subscription_tier AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'basic',
    status subscription_status NOT NULL DEFAULT 'incomplete',
    max_students INTEGER NOT NULL DEFAULT 50,
    current_period_end TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(institution_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view their own institution's subscription"
    ON subscriptions FOR SELECT
    USING (
        institution_id = get_institution_id() 
        AND get_user_role() = 'institution_admin'
    );

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to initialize subscription for new institutions
CREATE OR REPLACE FUNCTION initialize_basic_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (institution_id, tier, status, max_students)
    VALUES (NEW.id, 'basic', 'active', 100); -- Default 100 students for basic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_institution_created_init_sub
    AFTER INSERT ON institutions
    FOR EACH ROW
    EXECUTE FUNCTION initialize_basic_subscription();

-- Backfill existing institutions
INSERT INTO subscriptions (institution_id, tier, status, max_students)
SELECT id, 'basic', 'active', 100 
FROM institutions
ON CONFLICT (institution_id) DO NOTHING;
