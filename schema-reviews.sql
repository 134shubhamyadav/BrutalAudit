-- Run this in the Supabase SQL Editor to create the reviews table

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Since we are querying this from a server-side Next.js route using the service role key,
-- we don't strictly need RLS policies, but it's good practice.
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone (so the landing page can fetch live reviews)
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Allow authenticated inserts (though we do this via the server API anyway)
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (true);
