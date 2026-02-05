-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SELECT: Users can read their own subscription
-- =====================================================
CREATE POLICY "Users can select own subscription"
ON subscriptions
FOR SELECT
USING (
  auth.uid() = user_id
);

-- =====================================================
-- INSERT: Users can create ONLY their own free trial
-- =====================================================
CREATE POLICY "Users can create initial free trial"
ON subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND plan_name = 'free_trial'
  AND status = 'trialing'
);

-- =====================================================
-- UPDATE: Users can update ONLY their own row
-- (column-level control below restricts what they can change)
-- =====================================================
CREATE POLICY "Users can update own subscription"
ON subscriptions
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- =====================================================
-- COLUMN-LEVEL SECURITY
-- Users may ONLY update the `status` column
-- =====================================================
REVOKE UPDATE ON subscriptions FROM authenticated;
GRANT UPDATE (status) ON subscriptions TO authenticated;

-- =====================================================
-- OPTIONAL: Explicitly deny DELETE for authenticated users
-- =====================================================
REVOKE DELETE ON subscriptions FROM authenticated;

-- =====================================================
-- (Optional) Admin / service role safety
-- Service role bypasses RLS by default
-- =====================================================
-- No policies needed for service role
