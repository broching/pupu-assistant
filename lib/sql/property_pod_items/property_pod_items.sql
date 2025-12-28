CREATE TABLE property_pod_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- unique ID for each item
    user_id UUID NOT NULL,                         -- user who owns this pod
    pod_id UUID NOT NULL,                          -- the pod/group this item belongs to

    -- Mandatory fields for reliable queries
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    district TEXT NOT NULL,
    region TEXT NOT NULL,
    price NUMERIC NOT NULL,
    property_type TEXT NOT NULL,
    tenure TEXT NOT NULL,
    size_sqft NUMERIC NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    unit_number TEXT NOT NULL,

    -- Optional fields for extra context
    furnishing TEXT,
    available_from TEXT,
    description TEXT,
    developer TEXT,
    project_name TEXT,
    year_built INTEGER,
    mrt_info TEXT,
    verified_listing BOOLEAN,
    listing_url TEXT,

    -- New fields for better query coverage
    listing_type TEXT,               -- "sale", "rent", "lease", etc.
    facilities TEXT[],               -- e.g. '{Pool, Gym, BBQ, Playground}'
    restrictions TEXT,               -- e.g. "No pets allowed", "Singles only"
    nearby_buildings TEXT[],         -- e.g. '{ION Orchard, Raffles Place MRT, Nanyang Poly}'
    listing_status TEXT DEFAULT 'available',-- e.g. available, reserved, sold, rented
    lease_term TEXT, -- e.g. "1 year min", "6 months flexible"
    maintenance_fee NUMERIC,  -- optional
    extra_information TEXT, 

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
