-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is active member of a club
CREATE OR REPLACE FUNCTION is_club_member(p_club_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is staff/president/treasurer in club
CREATE OR REPLACE FUNCTION is_club_staff(p_club_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND user_id = p_user_id
      AND role IN ('president', 'staff', 'treasurer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is president of club
CREATE OR REPLACE FUNCTION is_club_president(p_club_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND user_id = p_user_id AND role = 'president'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is treasurer/president of club
CREATE OR REPLACE FUNCTION is_club_treasurer(p_club_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND user_id = p_user_id
      AND role IN ('president', 'treasurer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is enrolled
CREATE OR REPLACE FUNCTION is_enrolled(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND enrollment_status = 'enrolled'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- clubs: active/inactive visible to all; deleted hidden
CREATE POLICY "clubs_select" ON clubs FOR SELECT USING (status != 'deleted');
CREATE POLICY "clubs_insert" ON clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clubs_update" ON clubs FOR UPDATE USING (is_club_president(id));
CREATE POLICY "clubs_delete" ON clubs FOR DELETE USING (is_club_president(id));

-- club_members
CREATE POLICY "club_members_select" ON club_members FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "club_members_insert" ON club_members FOR INSERT
  WITH CHECK (is_club_president(club_id) OR user_id = auth.uid());
CREATE POLICY "club_members_update" ON club_members FOR UPDATE
  USING (is_club_president(club_id));
CREATE POLICY "club_members_delete" ON club_members FOR DELETE
  USING (is_club_president(club_id) OR user_id = auth.uid());

-- join_requests
CREATE POLICY "join_requests_select" ON join_requests FOR SELECT
  USING (user_id = auth.uid() OR is_club_staff(club_id));
CREATE POLICY "join_requests_insert" ON join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);
CREATE POLICY "join_requests_update" ON join_requests FOR UPDATE
  USING (is_club_staff(club_id));

-- posts
CREATE POLICY "posts_select" ON posts FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "posts_insert" ON posts FOR INSERT
  WITH CHECK (
    is_club_member(club_id) AND is_enrolled()
  );
CREATE POLICY "posts_update" ON posts FOR UPDATE
  USING (author_id = auth.uid() OR is_club_staff(club_id));
CREATE POLICY "posts_delete" ON posts FOR DELETE
  USING (author_id = auth.uid() OR is_club_staff(club_id));

-- post_reads
CREATE POLICY "post_reads_select" ON post_reads FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "post_reads_insert" ON post_reads FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_club_member(
    (SELECT club_id FROM posts WHERE id = post_id)
  ));

-- comments
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (is_club_member((SELECT club_id FROM posts WHERE id = post_id)));
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND is_enrolled()
    AND is_club_member((SELECT club_id FROM posts WHERE id = post_id))
  );
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (author_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (author_id = auth.uid() OR is_club_staff(
    (SELECT club_id FROM posts WHERE id = post_id)
  ));

-- likes
CREATE POLICY "likes_select" ON likes FOR SELECT
  USING (is_club_member((SELECT club_id FROM posts WHERE id = post_id)));
CREATE POLICY "likes_insert" ON likes FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_enrolled());
CREATE POLICY "likes_delete" ON likes FOR DELETE
  USING (user_id = auth.uid());

-- events
CREATE POLICY "events_select" ON events FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "events_insert" ON events FOR INSERT
  WITH CHECK (is_club_staff(club_id));
CREATE POLICY "events_update" ON events FOR UPDATE
  USING (is_club_staff(club_id));
CREATE POLICY "events_delete" ON events FOR DELETE
  USING (is_club_staff(club_id));

-- event_votes
CREATE POLICY "event_votes_select" ON event_votes FOR SELECT
  USING (is_club_member((SELECT club_id FROM events WHERE id = event_id)));
CREATE POLICY "event_votes_insert" ON event_votes FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_enrolled());
CREATE POLICY "event_votes_update" ON event_votes FOR UPDATE
  USING (user_id = auth.uid() AND is_enrolled());
CREATE POLICY "event_votes_delete" ON event_votes FOR DELETE
  USING (user_id = auth.uid());

-- event_reminders
CREATE POLICY "event_reminders_select" ON event_reminders FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "event_reminders_insert" ON event_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "event_reminders_delete" ON event_reminders FOR DELETE
  USING (user_id = auth.uid());

-- messages: channel access based on club membership or DM participant
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    (channel LIKE 'club:%' AND is_club_member(
      SPLIT_PART(channel::text, ':', 2)::uuid
    )) OR
    (channel LIKE 'dm:%' AND (
      channel LIKE '%' || auth.uid()::text || '%'
    ))
  );
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      (channel LIKE 'club:%' AND is_club_member(
        (SPLIT_PART(channel, ':', 2))::uuid
      ) AND is_enrolled()) OR
      (channel LIKE 'dm:%' AND channel LIKE '%' || auth.uid()::text || '%')
    )
  );

-- albums
CREATE POLICY "albums_select" ON albums FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "albums_insert" ON albums FOR INSERT
  WITH CHECK (is_club_staff(club_id));
CREATE POLICY "albums_update" ON albums FOR UPDATE
  USING (is_club_staff(club_id));
CREATE POLICY "albums_delete" ON albums FOR DELETE
  USING (is_club_staff(club_id));

-- gallery_items: enrolled members + graduates can view
CREATE POLICY "gallery_items_select" ON gallery_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      JOIN profiles p ON p.id = cm.user_id
      WHERE cm.club_id = gallery_items.club_id
        AND cm.user_id = auth.uid()
        AND p.enrollment_status IN ('enrolled', 'graduated')
    )
  );
CREATE POLICY "gallery_items_insert" ON gallery_items FOR INSERT
  WITH CHECK (uploader_id = auth.uid() AND is_enrolled() AND is_club_member(club_id));
CREATE POLICY "gallery_items_delete" ON gallery_items FOR DELETE
  USING (uploader_id = auth.uid() OR is_club_staff(club_id));

-- dues_income
CREATE POLICY "dues_income_select" ON dues_income FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "dues_income_insert" ON dues_income FOR INSERT
  WITH CHECK (is_club_treasurer(club_id));
CREATE POLICY "dues_income_update" ON dues_income FOR UPDATE
  USING (is_club_treasurer(club_id));
CREATE POLICY "dues_income_delete" ON dues_income FOR DELETE
  USING (is_club_treasurer(club_id));

-- dues_expense
CREATE POLICY "dues_expense_select" ON dues_expense FOR SELECT
  USING (is_club_member(club_id));
CREATE POLICY "dues_expense_insert" ON dues_expense FOR INSERT
  WITH CHECK (is_club_treasurer(club_id));
CREATE POLICY "dues_expense_update" ON dues_expense FOR UPDATE
  USING (is_club_treasurer(club_id));
CREATE POLICY "dues_expense_delete" ON dues_expense FOR DELETE
  USING (is_club_treasurer(club_id));

-- activity_logs
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- push_subscriptions
CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
