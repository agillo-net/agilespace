-- =====================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================
-- This trigger automatically creates a profile when a new user signs up via GitHub

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (
    id,
    full_name,
    github_username,
    github_id,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'preferred_username', 'Unknown User'),
    NEW.raw_user_meta_data->>'preferred_username',
    (NEW.raw_user_meta_data->>'provider_id')::bigint,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    github_username = COALESCE(EXCLUDED.github_username, profiles.github_username),
    github_id = COALESCE(EXCLUDED.github_id, profiles.github_id),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PROFILE UPDATE TRIGGER
-- =====================================================
-- This trigger updates profile when user metadata changes

CREATE OR REPLACE FUNCTION handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile if user metadata has changed
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
      github_username = COALESCE(NEW.raw_user_meta_data->>'preferred_username', profiles.github_username),
      github_id = COALESCE((NEW.raw_user_meta_data->>'provider_id')::bigint, profiles.github_id),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', profiles.avatar_url)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger that fires when user metadata is updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_metadata_update();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile when a new user signs up via GitHub OAuth';
COMMENT ON FUNCTION handle_user_metadata_update IS 'Automatically updates profile when user metadata changes (e.g., GitHub info update)';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create profile on user signup';
COMMENT ON TRIGGER on_auth_user_updated ON auth.users IS 'Trigger to update profile when user metadata changes';
