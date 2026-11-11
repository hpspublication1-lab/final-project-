# SAMYAK MULTIPLAYER — EMERGENCY ROLLBACK RUNBOOK
**Document Version:** 1.0.0-ROLLBACK  
**Scope:** Immediate Incident Response & Rollback Procedures  
**Date:** November 10, 2026  
**Incident Commander:** Lead DevOps & SRE Engineer  

---

## 1. Fast Feature-Flag Deactivation (< 60 Seconds, Zero Downtime)

If unexpected network partitioning, WebSocket proxy errors, or client compatibility issues emerge in production:

1. **Navigate to Vercel Project Dashboard:**
   - Go to **Settings > Environment Variables**.
   - Locate `NEXT_PUBLIC_MULTIPLAYER_COLYSEUS_ENABLED`.
   - Update value from `true` to `false`.
   - Click **Save**.
2. **Instant Client Fallback:**
   - The web application immediately routes all Battle Arena traffic through the server-authoritative Next.js route `/api/arena/results/submit` and Supabase Realtime broadcast channels.
   - Active students continue competing without encountering page errors or disconnection screens.

---

## 2. Multiplayer Service Process Shutdown

To stop the Colyseus multiplayer daemon on the VM or container cluster:

### Systemd Service:
```bash
sudo systemctl stop samyak-multiplayer
sudo systemctl status samyak-multiplayer
```

### Docker Compose:
```bash
docker compose -f docker-compose.prod.yml down
```

---

## 3. Database Migration Rollback (Optional / If Required)

> [!NOTE]
> Database rollback is rarely required because all database columns added in `20261110000001_multiplayer_security_hardening.sql` are strictly additive and nullable. They do not break existing queries.

If database rollback is explicitly mandated by security policy:

```sql
BEGIN;

-- 1. Drop partial unique index on idempotency_hash
DROP INDEX IF EXISTS public.uq_battle_results_idempotency_hash;

-- 2. Drop authoritative RPC
DROP FUNCTION IF EXISTS public.record_authoritative_battle_result(
  UUID, UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT, JSONB
);

-- 3. Drop additive telemetry and idempotency columns
ALTER TABLE public.battle_results
  DROP COLUMN IF EXISTS idempotency_hash,
  DROP COLUMN IF EXISTS server_node_id,
  DROP COLUMN IF EXISTS engine_version,
  DROP COLUMN IF EXISTS finalized_at,
  DROP COLUMN IF EXISTS telemetry_audit;

-- 4. Restore permissive select policy if needed for legacy compatibility
DROP POLICY IF EXISTS "participants_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_read_battle_rooms" ON public.battle_rooms FOR SELECT USING (true);

COMMIT;
```

---

## 4. Post-Rollback Health Verification Checklist

After executing rollback procedures:
- [ ] Verify `https://samyakcee.com/battle-arena` loads successfully.
- [ ] Start a standard 1v1 quiz battle and verify questions render properly.
- [ ] Submit an answer choice and verify score evaluation completes via `/api/arena/results/submit`.
- [ ] Confirm `public.battle_results` records the match completion row.
- [ ] Check Sentry / Datadog error monitoring dashboards for error spikes.
