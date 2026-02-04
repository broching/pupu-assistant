-- Enable Row Level Security on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can select own subscription"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Only the backend (service role) can insert/update/delete (e.g. signup trial, webhooks)
-- No INSERT/UPDATE/DELETE for auth.uid() so clients cannot change their subscription directly
-- Service role bypasses RLS by default
