CREATE TABLE subreddit_scores (
    id SERIAL PRIMARY KEY,
    subreddit TEXT NOT NULL,
    lean_score INTEGER NOT NULL,
    echo_index INTEGER NOT NULL,
    domain_bias INTEGER NOT NULL,
    daily_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE subreddit_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON subreddit_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public reads" ON subreddit_scores FOR SELECT USING (true);
