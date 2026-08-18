-- ============================================================
-- Migration: auto-generate in-app notifications
-- Timestamp: 20260721080000
-- ============================================================
--
-- The notifications table + the notification-bell UI (DashboardLayout)
-- already exist and are wired to Supabase Realtime, but nothing ever
-- INSERTED notification rows, so the bell was always empty. This adds
-- a trigger that creates a real notification when someone replies to a
-- student's doubt — the highest-value, precisely-targeted event.
--
-- (Broadcast-style notifications like "a live class just went live for
-- everyone" require a fan-out job and are intentionally left for a
-- scheduled task; and actually EMAILING these notifications needs an
-- external provider key — see the app's deployment checklist.)
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_doubt_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_title      TEXT;
  v_replier    TEXT;
BEGIN
  SELECT d.student_id, d.title INTO v_student_id, v_title
  FROM public.doubts d
  WHERE d.id = NEW.doubt_id;

  -- Only notify the doubt owner, and never notify them about their own reply.
  IF v_student_id IS NULL OR v_student_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'A teacher') INTO v_replier
  FROM public.user_profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, notification_type)
  VALUES (
    v_student_id,
    'New reply to your doubt',
    COALESCE(v_replier, 'Someone') || ' replied to "' || COALESCE(v_title, 'your question') || '"',
    'info'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let a notification failure block the reply itself.
    RAISE NOTICE 'notify_on_doubt_reply failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_doubt_reply_notify ON public.doubt_replies;
CREATE TRIGGER on_doubt_reply_notify
  AFTER INSERT ON public.doubt_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_doubt_reply();
