-- Enable Row Level Security on the pods table
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;

-- Policy for selecting pods: users can only see their own pods
CREATE POLICY "Users can select their own pods"
ON pods
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for inserting pods: users can only insert pods for themselves
CREATE POLICY "Users can insert their own pods"
ON pods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for updating pods: users can only update their own pods
CREATE POLICY "Users can update their own pods"
ON pods
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting pods: users can only delete their own pods
CREATE POLICY "Users can delete their own pods"
ON pods
FOR DELETE
USING (auth.uid() = user_id);
