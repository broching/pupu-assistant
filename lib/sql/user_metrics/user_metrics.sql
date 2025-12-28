CREATE TABLE user_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_messages_sent INT DEFAULT 0,      -- total messages the bot has sent
    total_messages_received INT DEFAULT 0,  -- total messages received from users
    bot_active_hours INT DEFAULT 0,         -- optional, can track duration of activity
    last_message_at TIMESTAMPTZ,            -- timestamp of last message
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
