-- Add subscription tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Daily Usage Tracking Table
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'ai_generation', 'worksheet', 'summary'
  usage_date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  UNIQUE(user_id, action_type, usage_date)
);

-- Enable RLS
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily usage" ON daily_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Function to increment usage safely
CREATE OR REPLACE FUNCTION increment_daily_usage(_user_id UUID, _action_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_usage (user_id, action_type, usage_date, count)
  VALUES (_user_id, _action_type, CURRENT_DATE, 1)
  ON CONFLICT (user_id, action_type, usage_date)
  DO UPDATE SET count = daily_usage.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;