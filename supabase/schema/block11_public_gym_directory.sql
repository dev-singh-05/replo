-- ============================================================
-- REPLO — Block 11: Public Gym Directory (Read-Only)
-- Allows unauthenticated users to browse gyms on the selection screen
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Only expose minimal fields: id, name, city, country
-- The anon key can read active gyms for the gym selection screen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'gyms'
          AND policyname = 'gyms_public_directory'
    ) THEN
        EXECUTE '
            CREATE POLICY gyms_public_directory ON public.gyms
                FOR SELECT USING (is_active = true)
        ';
    END IF;
END $$;

-- ============================================================
-- DONE! Unauthenticated users can now browse active gyms.
-- ============================================================
