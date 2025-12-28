-- Enable Row Level Security
ALTER TABLE property_pod_items ENABLE ROW LEVEL SECURITY;

-- Policy for selecting items: users can only see their own items
CREATE POLICY "Users can select their own items"
ON property_pod_items
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for inserting items: users can only insert items for themselves
CREATE POLICY "Users can insert their own items"
ON property_pod_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for updating items: users can only update their own items
CREATE POLICY "Users can update their own items"
ON property_pod_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting items: users can only delete their own items
CREATE POLICY "Users can delete their own items"
ON property_pod_items
FOR DELETE
USING (auth.uid() = user_id);
