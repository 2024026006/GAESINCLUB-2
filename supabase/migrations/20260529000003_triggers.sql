-- Trigger: update like_count on likes insert/delete
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Trigger: update profiles.point on activity_logs insert
CREATE OR REPLACE FUNCTION update_user_point()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET point = point + NEW.point
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_user_point
  AFTER INSERT ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION update_user_point();

-- Trigger: block president from leaving without transferring role
CREATE OR REPLACE FUNCTION block_president_leave()
RETURNS trigger AS $$
BEGIN
  IF OLD.role = 'president' THEN
    RAISE EXCEPTION '동아리장은 권한을 이전한 후에만 탈퇴할 수 있습니다.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_block_president_leave
  BEFORE DELETE ON club_members
  FOR EACH ROW EXECUTE FUNCTION block_president_leave();

-- Trigger: auto-update clubs.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: recommend clubs by cosine similarity with user interest vector
CREATE OR REPLACE FUNCTION recommend_clubs(p_user_id uuid)
RETURNS TABLE(club_id uuid, similarity float) AS $$
  SELECT c.id, 1 - (c.embedding <=> p.interest_vector) AS similarity
  FROM clubs c, profiles p
  WHERE p.id = p_user_id
    AND c.status = 'active'
    AND c.embedding IS NOT NULL
    AND p.interest_vector IS NOT NULL
  ORDER BY similarity DESC
  LIMIT 5;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function: get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid DEFAULT auth.uid())
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM notifications
  WHERE user_id = p_user_id AND read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- pg_cron: remind every minute for event_reminders
SELECT cron.schedule(
  'event-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'event_reminder',
      'remind_at', now()
    )
  ) FROM event_reminders
  WHERE remind_at <= now() + interval '1 minute'
    AND remind_at > now() - interval '1 minute';
  $$
);
