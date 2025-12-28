CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- unique message ID
    user_id UUID NOT NULL REFERENCES users(id),   -- bot owner's ID
    contact_number TEXT NOT NULL,                 -- sender's number (e.g. 6593369245)
    contact_name TEXT,                            -- resolved contact name (from message._data.notifyName or pushname)
    body TEXT,                                    -- message text
    type TEXT,                                    -- message type (chat, image, audio, video, etc.)
    has_media BOOLEAN DEFAULT FALSE,              -- whether media is attached
    media_url TEXT,                               -- optional link to stored media
    timestamp TIMESTAMPTZ NOT NULL,               -- message time
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- AI ENHANCEMENTS
    score INT,                                    -- numeric score for conversion likelihood (e.g. 0–100)
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'urgent')), -- urgency classification
    insights TEXT,                                -- GPT-generated insights about the message
    actions TEXT,                                 -- GPT-recommended actions for the agent
    resolved BOOLEAN DEFAULT FALSE                -- whether this lead/message has been resolved
);
