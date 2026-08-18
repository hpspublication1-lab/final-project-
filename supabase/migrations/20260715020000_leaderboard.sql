-- ============================================================
-- Samyak CEE Mastery — Leaderboard Module Migration
-- ============================================================

-- 1. Add leaderboard_snapshots table for daily/weekly snapshots
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  snapshot_period TEXT NOT NULL CHECK (snapshot_period IN ('daily', 'weekly', 'all_time')),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  battle_rating INTEGER DEFAULT 1000,
  total_points INTEGER DEFAULT 0,
  mock_score_avg NUMERIC(5,2) DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  battles_played INTEGER DEFAULT 0,
  rank_position INTEGER,
  subject_filter TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, snapshot_period, snapshot_date, subject_filter)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period ON public.leaderboard_snapshots(snapshot_period, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_student ON public.leaderboard_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_subject ON public.leaderboard_snapshots(subject_filter);

-- 2. Function: compute leaderboard with tie-breaking logic
-- Tie-breaking order: battle_rating DESC → accuracy DESC → mock_score_avg DESC → questions_attempted DESC → created_at ASC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period TEXT DEFAULT 'all_time',
  p_subject TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  student_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  cee_year INTEGER,
  subscription_plan TEXT,
  battle_rating INTEGER,
  total_points INTEGER,
  mock_score_avg NUMERIC,
  accuracy NUMERIC,
  questions_attempted BIGINT,
  battles_won BIGINT,
  battles_played BIGINT,
  rank_position BIGINT,
  rank_change INTEGER,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Determine time window
  IF p_period = 'daily' THEN
    v_start_date := CURRENT_DATE::TIMESTAMPTZ;
  ELSIF p_period = 'weekly' THEN
    v_start_date := (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ;
  ELSE
    v_start_date := '2000-01-01'::TIMESTAMPTZ;
  END IF;

  RETURN QUERY
  WITH subject_filter AS (
    SELECT s.id AS subject_id
    FROM public.subjects s
    WHERE p_subject = 'all' OR s.name::TEXT = p_subject
  ),
  practice_stats AS (
    SELECT
      pa.student_id,
      COUNT(*) AS questions_attempted,
      CASE WHEN COUNT(*) > 0
        THEN ROUND((SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0
      END AS accuracy
    FROM public.practice_attempts pa
    WHERE pa.created_at >= v_start_date
      AND (p_subject = 'all' OR pa.subject_id IN (SELECT subject_id FROM subject_filter))
    GROUP BY pa.student_id
  ),
  mock_stats AS (
    SELECT
      ea.student_id,
      ROUND(AVG(ea.percentage), 2) AS mock_score_avg
    FROM public.exam_attempts ea
    JOIN public.exams e ON ea.exam_id = e.id
    WHERE ea.completed_at >= v_start_date
      AND (p_subject = 'all' OR e.subject_id IN (SELECT subject_id FROM subject_filter))
    GROUP BY ea.student_id
  ),
  battle_stats AS (
    SELECT
      br.player_id AS student_id,
      COUNT(*) AS battles_played,
      SUM(CASE WHEN br.is_winner THEN 1 ELSE 0 END) AS battles_won
    FROM public.battle_results br
    JOIN public.battle_rooms broom ON br.room_id = broom.id
    WHERE broom.completed_at >= v_start_date
      AND (p_subject = 'all' OR broom.subject_id IN (SELECT subject_id FROM subject_filter))
    GROUP BY br.player_id
  ),
  combined AS (
    SELECT
      up.id AS student_id,
      up.full_name,
      up.avatar_url,
      up.college,
      up.cee_year,
      up.subscription_plan::TEXT,
      up.battle_rating,
      up.total_points,
      COALESCE(ms.mock_score_avg, 0) AS mock_score_avg,
      COALESCE(ps.accuracy, 0) AS accuracy,
      COALESCE(ps.questions_attempted, 0) AS questions_attempted,
      COALESCE(bs.battles_won, 0) AS battles_won,
      COALESCE(bs.battles_played, 0) AS battles_played,
      up.created_at AS joined_at
    FROM public.user_profiles up
    LEFT JOIN practice_stats ps ON ps.student_id = up.id
    LEFT JOIN mock_stats ms ON ms.student_id = up.id
    LEFT JOIN battle_stats bs ON bs.student_id = up.id
    WHERE up.is_active = true
      AND up.role = 'student'
  )
  SELECT
    c.student_id,
    c.full_name,
    c.avatar_url,
    c.college,
    c.cee_year,
    c.subscription_plan,
    c.battle_rating,
    c.total_points,
    c.mock_score_avg,
    c.accuracy,
    c.questions_attempted,
    c.battles_won,
    c.battles_played,
    ROW_NUMBER() OVER (
      ORDER BY
        c.battle_rating DESC,
        c.accuracy DESC,
        c.mock_score_avg DESC,
        c.questions_attempted DESC,
        c.joined_at ASC
    ) AS rank_position,
    0::INTEGER AS rank_change,
    c.joined_at
  FROM combined c
  LIMIT p_limit;
END;
$$;

-- 3. Function: get current user's rank
CREATE OR REPLACE FUNCTION public.get_my_rank(
  p_period TEXT DEFAULT 'all_time',
  p_subject TEXT DEFAULT 'all'
)
RETURNS TABLE(
  rank_position BIGINT,
  total_students BIGINT,
  percentile NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_my_rank BIGINT;
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.user_profiles
  WHERE is_active = true AND role = 'student';

  SELECT lb.rank_position INTO v_my_rank
  FROM public.get_leaderboard(p_period, p_subject, 10000) lb
  WHERE lb.student_id = auth.uid()
  LIMIT 1;

  RETURN QUERY
  SELECT
    COALESCE(v_my_rank, v_total),
    v_total,
    CASE WHEN v_total > 0 AND v_my_rank IS NOT NULL
      THEN ROUND(((v_total - v_my_rank)::NUMERIC / v_total) * 100, 1)
      ELSE 0
    END;
END;
$$;

-- 4. RLS on leaderboard_snapshots
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_leaderboard_snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "public_read_leaderboard_snapshots"
ON public.leaderboard_snapshots
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_manage_own_leaderboard_snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "users_manage_own_leaderboard_snapshots"
ON public.leaderboard_snapshots
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 5. Seed additional demo student data for a richer leaderboard
DO $$
DECLARE
  student_uuids UUID[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid()
  ];
  demo_names TEXT[] := ARRAY[
    'Sita Rai', 'Bikash Thapa', 'Anita Gurung', 'Rohan Shrestha',
    'Manisha Karki', 'Dipesh Adhikari', 'Sunita Tamang', 'Arun Poudel',
    'Nisha Bhandari', 'Suresh Magar'
  ];
  demo_emails TEXT[] := ARRAY[
    'sita.rai@samyakcee.edu.np', 'bikash.thapa@samyakcee.edu.np',
    'anita.gurung@samyakcee.edu.np', 'rohan.shrestha@samyakcee.edu.np',
    'manisha.karki@samyakcee.edu.np', 'dipesh.adhikari@samyakcee.edu.np',
    'sunita.tamang@samyakcee.edu.np', 'arun.poudel@samyakcee.edu.np',
    'nisha.bhandari@samyakcee.edu.np', 'suresh.magar@samyakcee.edu.np'
  ];
  demo_ratings INTEGER[] := ARRAY[1480, 1420, 1390, 1350, 1310, 1280, 1240, 1200, 1160, 1120];
  demo_points INTEGER[] := ARRAY[9800, 8600, 7900, 7200, 6800, 6100, 5500, 4900, 4200, 3800];
  demo_colleges TEXT[] := ARRAY[
    'Kathmandu Model College', 'St. Xavier College', 'Tri-Chandra College',
    'Amrit Science College', 'Pinnacle College', 'National College',
    'Budhanilkantha School', 'Sifal Secondary School', 'Lalitpur Secondary School',
    'Patan Multiple Campus'
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    -- Insert auth user
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      student_uuids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      demo_emails[i],
      crypt('CEE2026#Demo', gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('full_name', demo_names[i], 'role', 'student'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;

    -- Update profile with leaderboard-relevant data
    UPDATE public.user_profiles SET
      battle_rating = demo_ratings[i],
      total_points = demo_points[i],
      college = demo_colleges[i],
      cee_year = 2026,
      study_streak = (10 + i * 3),
      subscription_plan = CASE WHEN i <= 3 THEN 'pro'::public.subscription_plan ELSE 'student'::public.subscription_plan END
    WHERE id = student_uuids[i];
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Demo student seeding: %', SQLERRM;
END $$;

-- 6. Update existing demo students' ratings for variety
DO $$
BEGIN
  UPDATE public.user_profiles SET
    battle_rating = 1550,
    total_points = 12400,
    college = 'Kathmandu Model College',
    cee_year = 2026,
    study_streak = 42
  WHERE email = 'priya.thapa@samyakcee.edu.np';

  UPDATE public.user_profiles SET
    battle_rating = 1180,
    total_points = 4100,
    college = 'Tri-Chandra College',
    cee_year = 2026,
    study_streak = 15
  WHERE email = 'aarav.sharma@samyakcee.edu.np';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Existing user update: %', SQLERRM;
END $$;
