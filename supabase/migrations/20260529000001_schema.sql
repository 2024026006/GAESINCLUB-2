-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  student_id text UNIQUE,
  department text,
  college text,
  enrollment_status text CHECK (enrollment_status IN ('enrolled', 'leave', 'graduated')),
  phone text,
  point integer DEFAULT 0,
  interest_vector vector(1536),
  created_at timestamptz DEFAULT now()
);

-- clubs
CREATE TABLE clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('교양', '학술', '문화', '봉사', '체육', '종교')),
  short_desc text,
  description text,
  recruit_status text NOT NULL DEFAULT 'open' CHECK (recruit_status IN ('open', 'closed')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  founded_year integer,
  embedding vector(1536),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- club_members
CREATE TABLE club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('president', 'staff', 'treasurer', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- join_requests
CREATE TABLE join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'on_hold')),
  requested_at timestamptz DEFAULT now()
);

-- posts
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- post_reads
CREATE TABLE post_reads (
  post_id uuid REFERENCES posts ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- comments
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  parent_id uuid REFERENCES comments ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- likes
CREATE TABLE likes (
  post_id uuid REFERENCES posts ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- events
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location text,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- event_votes
CREATE TABLE event_votes (
  event_id uuid REFERENCES events ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('attend', 'absent', 'undecided')),
  PRIMARY KEY (event_id, user_id)
);

-- event_reminders
CREATE TABLE event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  remind_at timestamptz NOT NULL
);

-- messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  sender_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX messages_channel_created_idx ON messages (channel, created_at DESC);

-- albums
CREATE TABLE albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- gallery_items
CREATE TABLE gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  album_id uuid REFERENCES albums ON DELETE SET NULL,
  uploader_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  type text NOT NULL CHECK (type IN ('image', 'video', 'document')),
  created_at timestamptz DEFAULT now()
);

-- dues_income
CREATE TABLE dues_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  amount integer NOT NULL,
  paid_at date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- dues_expense
CREATE TABLE dues_expense (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs ON DELETE CASCADE,
  item text NOT NULL,
  amount integer NOT NULL,
  spent_at date NOT NULL,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- activity_logs
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  club_id uuid REFERENCES clubs ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('attendance', 'post', 'comment', 'event', 'vote')),
  point integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

-- push_subscriptions (Web Push)
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Trigger: auto create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
