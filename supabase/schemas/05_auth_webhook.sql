-- Function to handle GitHub authentication webhook
CREATE OR REPLACE FUNCTION handle_github_auth() 
RETURNS TRIGGER AS $$
DECLARE
  github_user_record RECORD;
BEGIN
  -- Get GitHub user data from the webhook payload
  SELECT 
    raw_user_meta_data->>'id' as github_id,
    raw_user_meta_data->>'user_name' as username,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'name' as full_name
  INTO github_user_record
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Update profile with GitHub information
  UPDATE profiles
  SET 
    display_name = COALESCE(github_user_record.full_name, github_user_record.username),
    avatar_url = github_user_record.avatar_url,
    github_username = github_user_record.username,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_github_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION handle_github_auth();
