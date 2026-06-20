-- World Cup 2026 Records Tracker - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  group_name TEXT,
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  draws INT DEFAULT 0,
  losses INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  position TEXT,
  photo_url TEXT,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  clean_sheets INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INT,
  away_score INT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'postponed')),
  minute INT,
  stadium TEXT,
  venue TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  attendance INT,
  goalscorers TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Records Broken
CREATE TABLE IF NOT EXISTS records_broken (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  previous_holder TEXT NOT NULL,
  new_holder TEXT NOT NULL,
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'legendary')),
  explanation TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Records Created
CREATE TABLE IF NOT EXISTS records_created (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  holder TEXT NOT NULL,
  value TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament Stats (singleton)
CREATE TABLE IF NOT EXISTS tournament_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matches_played INT DEFAULT 0,
  goals_scored INT DEFAULT 0,
  records_broken INT DEFAULT 0,
  records_created INT DEFAULT 0,
  teams_participating INT DEFAULT 0,
  attendance_total INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'record_broken', 'record_created', 'match_highlight', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  event_date TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter Signups
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorite Teams
CREATE TABLE IF NOT EXISTS favorite_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, session_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_records_broken_date ON records_broken(event_date);
CREATE INDEX IF NOT EXISTS idx_records_created_date ON records_created(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_goals ON players(goals DESC);

-- Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE records_broken ENABLE ROW LEVEL SECURITY;
ALTER TABLE records_created ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read records_broken" ON records_broken FOR SELECT USING (true);
CREATE POLICY "Public read records_created" ON records_created FOR SELECT USING (true);
CREATE POLICY "Public read tournament_stats" ON tournament_stats FOR SELECT USING (true);
CREATE POLICY "Public read timeline_events" ON timeline_events FOR SELECT USING (true);

-- Newsletter insert
CREATE POLICY "Public insert newsletter" ON newsletter_signups FOR INSERT WITH CHECK (true);

-- Favorite teams
CREATE POLICY "Public read favorites" ON favorite_teams FOR SELECT USING (true);
CREATE POLICY "Public insert favorites" ON favorite_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete favorites" ON favorite_teams FOR DELETE USING (true);

-- Admin policies (authenticated admins only for write)
CREATE POLICY "Admin read admins" ON admins FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write teams" ON teams FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write players" ON players FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write matches" ON matches FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write records_broken" ON records_broken FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write records_created" ON records_created FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write tournament_stats" ON tournament_stats FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

CREATE POLICY "Admin write timeline_events" ON timeline_events FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admin upload images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'images' AND auth.uid() IN (SELECT user_id FROM admins)
);
CREATE POLICY "Admin update images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'images' AND auth.uid() IN (SELECT user_id FROM admins)
);
CREATE POLICY "Admin delete images" ON storage.objects FOR DELETE USING (
  bucket_id = 'images' AND auth.uid() IN (SELECT user_id FROM admins)
);

-- Initialize tournament stats
INSERT INTO tournament_stats (matches_played, goals_scored, records_broken, records_created, teams_participating, attendance_total)
SELECT 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM tournament_stats);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER records_broken_updated_at BEFORE UPDATE ON records_broken FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER records_created_updated_at BEFORE UPDATE ON records_created FOR EACH ROW EXECUTE FUNCTION update_updated_at();
