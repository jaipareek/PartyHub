-- ============================================
-- 🎉 PartyHub — Seed Data (Fixed)
-- Run this in Supabase SQL Editor
-- ============================================
-- 🧠 LEARN: The profiles table REFERENCES auth.users
-- So we must create auth users FIRST, then profiles, then venues, then events
-- This is called "respecting foreign key constraints"

-- Step 1: Create test users in auth.users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@partyhub.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"full_name": "PartyHub Admin"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'owner@partyhub.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"full_name": "Venue Owner Demo"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'user@partyhub.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"full_name": "Test User"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create profiles for these users
INSERT INTO profiles (id, full_name, email, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'PartyHub Admin', 'admin@partyhub.com', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Venue Owner Demo', 'owner@partyhub.com', 'venue_owner'),
  ('00000000-0000-0000-0000-000000000003', 'Test User', 'user@partyhub.com', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert Venues
INSERT INTO venues (id, owner_id, name, description, category, address, city, state, images, amenities, opening_time, closing_time, is_verified) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Neon Nights Club',
  'The hottest nightclub in town with world-class DJs, stunning LED visuals, and an electric dance floor.',
  'club',
  '45 MG Road, Brigade Gateway',
  'Bangalore',
  'Karnataka',
  ARRAY['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800', 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800'],
  ARRAY['DJ', 'Dance Floor', 'VIP Lounge', 'Parking', 'Full Bar'],
  '20:00',
  '03:00',
  true
),
(
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'The Rooftop Garden',
  'A stunning rooftop cafe with panoramic city views, craft cocktails, and chill vibes.',
  'cafe',
  '12 Koramangala 5th Block',
  'Bangalore',
  'Karnataka',
  ARRAY['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
  ARRAY['Rooftop', 'Live Music', 'Craft Cocktails', 'WiFi', 'Pet Friendly'],
  '11:00',
  '23:00',
  true
),
(
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'Underground Arena',
  'Raw. Loud. Unforgettable. Bangalore''s premier underground music venue.',
  'bar',
  '78 Indiranagar 100ft Road',
  'Bangalore',
  'Karnataka',
  ARRAY['https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=800', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'],
  ARRAY['Live Stage', 'Sound System', 'Merch Store', 'Smoking Area'],
  '18:00',
  '01:00',
  true
),
(
  'a0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'Laugh Factory',
  'The city''s top comedy club hosting the best standup comedians every weekend.',
  'restaurant',
  '34 Church Street',
  'Bangalore',
  'Karnataka',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'https://images.unsplash.com/photo-1485872299829-c44e4306ce2b?w=800'],
  ARRAY['Stage', 'Full Bar', 'Dinner Menu', 'AC', 'Wheelchair Access'],
  '17:00',
  '23:30',
  true
),
(
  'a0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  'Skyline Amphitheatre',
  'Open-air concert venue with capacity for 2000+. Hosts the biggest music festivals.',
  'outdoor',
  '90 Whitefield Main Road',
  'Bangalore',
  'Karnataka',
  ARRAY['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'],
  ARRAY['Open Air', 'Food Court', 'Parking', 'First Aid', 'Security'],
  '16:00',
  '23:00',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert Events
INSERT INTO events (id, venue_id, title, description, event_type, poster_url, date, start_time, end_time, pricing, total_capacity, booked_count, is_student_deal, student_discount_percent, tags, is_featured) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Neon Rave: EDM Night',
  'Get ready for the ultimate EDM experience! Featuring DJ Shadow spinning the sickest beats all night long.',
  'club_night',
  'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800',
  CURRENT_DATE,
  '21:00',
  '03:00',
  '[{"type": "general", "price": 500, "label": "General Entry"}, {"type": "couple", "price": 800, "label": "Couple Pass"}, {"type": "vip", "price": 2000, "label": "VIP Entry"}]'::jsonb,
  300,
  187,
  false, 0,
  ARRAY['edm', 'dj', 'dance', 'nightlife'],
  true
),
(
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'Sunset Jazz & Wine',
  'Unwind with soulful jazz performances while sipping curated wines on our rooftop.',
  'live_music',
  'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
  CURRENT_DATE,
  '18:00',
  '22:00',
  '[{"type": "general", "price": 300, "label": "General Entry"}, {"type": "couple", "price": 500, "label": "Couple Pass"}]'::jsonb,
  80,
  52,
  false, 0,
  ARRAY['jazz', 'wine', 'live music', 'rooftop'],
  true
),
(
  'e0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  'Metal Mayhem: Underground Show',
  'Raw, loud, and in your face! Featuring local metal bands. Mosh pit guaranteed!',
  'live_music',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  CURRENT_DATE + 1,
  '19:00',
  '23:00',
  '[{"type": "general", "price": 200, "label": "General Entry"}, {"type": "vip", "price": 500, "label": "Front Row VIP"}]'::jsonb,
  150,
  89,
  true, 30,
  ARRAY['metal', 'rock', 'live band', 'underground'],
  false
),
(
  'e0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  'LOL Fridays: Standup Comedy',
  'Featuring 5 of the funniest comedians in the city! Two hours of non-stop laughter.',
  'standup',
  'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800',
  CURRENT_DATE + 2,
  '19:30',
  '21:30',
  '[{"type": "general", "price": 400, "label": "General Entry"}, {"type": "couple", "price": 700, "label": "Couple Pass"}, {"type": "vip", "price": 1200, "label": "VIP + Dinner"}]'::jsonb,
  120,
  95,
  true, 20,
  ARRAY['comedy', 'standup', 'laughter', 'weekend'],
  true
),
(
  'e0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000005',
  'Echoes Music Festival 2026',
  'The biggest outdoor music festival of the year! 12 hours of live performances across 3 stages.',
  'live_music',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
  CURRENT_DATE + 7,
  '14:00',
  '02:00',
  '[{"type": "general", "price": 1500, "label": "General Entry"}, {"type": "vip", "price": 4000, "label": "VIP Lounge"}, {"type": "couple", "price": 2500, "label": "Couple Pass"}]'::jsonb,
  2000,
  843,
  false, 0,
  ARRAY['festival', 'outdoor', 'live music', 'food'],
  true
),
(
  'e0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000002',
  'Open Mic Night: Acoustic Sessions',
  'Got talent? Grab the mic! Open mic night for singers, poets, and storytellers.',
  'open_mic',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  CURRENT_DATE + 3,
  '19:00',
  '22:00',
  '[{"type": "general", "price": 100, "label": "Entry (includes 1 drink)"}]'::jsonb,
  60,
  23,
  true, 50,
  ARRAY['open mic', 'acoustic', 'poetry', 'student'],
  false
),
(
  'e0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'Bollywood Retro Night',
  'Dance to the greatest Bollywood hits from the 90s and 2000s! Best dressed wins free drinks!',
  'club_night',
  'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800',
  CURRENT_DATE + 5,
  '21:00',
  '03:00',
  '[{"type": "general", "price": 600, "label": "Stag Entry"}, {"type": "couple", "price": 900, "label": "Couple Pass"}, {"type": "vip", "price": 2500, "label": "VIP Table (4 people)"}]'::jsonb,
  250,
  112,
  false, 0,
  ARRAY['bollywood', 'retro', 'dance', 'nightlife'],
  true
),
(
  'e0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000003',
  'Gaming Tournament: Valorant',
  'Compete in the ultimate Valorant tournament! Solo or squad entry. Cash prizes for top 3 teams.',
  'gaming',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
  CURRENT_DATE + 4,
  '14:00',
  '20:00',
  '[{"type": "general", "price": 150, "label": "Solo Entry"}, {"type": "vip", "price": 500, "label": "Squad Entry (5 players)"}]'::jsonb,
  100,
  64,
  true, 25,
  ARRAY['gaming', 'esports', 'valorant', 'tournament'],
  false
)
ON CONFLICT (id) DO NOTHING;
