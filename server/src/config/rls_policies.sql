-- ============================================
-- 🎉 PartyHub — RLS Policies + Auth Trigger
-- Run this AFTER schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- VENUES
CREATE POLICY "Venues are viewable by everyone" ON venues FOR SELECT USING (true);
CREATE POLICY "Owners can create venues" ON venues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own venues" ON venues FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own venues" ON venues FOR DELETE USING (auth.uid() = owner_id);

-- EVENTS
CREATE POLICY "Active events are viewable by everyone" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Venue owners can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Venue owners can update own events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_id AND venues.owner_id = auth.uid())
);

-- BOOKINGS
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- REVIEWS
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- SQUADS
CREATE POLICY "Squad members can view squads" ON squads FOR SELECT USING (
  leader_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM squad_members WHERE squad_members.squad_id = id AND squad_members.user_id = auth.uid())
);
CREATE POLICY "Users can create squads" ON squads FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update squads" ON squads FOR UPDATE USING (auth.uid() = leader_id);

-- SQUAD MEMBERS
CREATE POLICY "Squad members can view members" ON squad_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM squads WHERE squads.id = squad_id AND (squads.leader_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_id AND sm.user_id = auth.uid())))
);
CREATE POLICY "Leaders can add members" ON squad_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM squads WHERE squads.id = squad_id AND squads.leader_id = auth.uid())
);
CREATE POLICY "Members can update own status" ON squad_members FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
