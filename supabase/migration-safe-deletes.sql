-- Prevent "delete auth user" from wiping all business data (safe to re-run)
-- Run in Supabase SQL Editor AFTER other migrations.
--
-- WHY: profiles.id references auth.users ON DELETE CASCADE.
-- Deleting an auth user removed the profile, which CASCADE-deleted every row
-- where created_by/author_id pointed at that profile (leads, clients, projects, etc.)

CREATE OR REPLACE FUNCTION public.replace_fk_set_null(
  p_table TEXT,
  p_column TEXT,
  p_ref_table TEXT DEFAULT 'profiles'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  con RECORD;
BEGIN
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', p_table, p_column);

  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE t.relname = p_table
      AND c.contype = 'f'
      AND a.attname = p_column
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', p_table, con.conname);
  END LOOP;

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I_%s_fkey FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE SET NULL',
    p_table, p_table, p_column, p_column, p_ref_table
  );
END;
$$;

SELECT public.replace_fk_set_null('projects', 'created_by');
SELECT public.replace_fk_set_null('tasks', 'created_by');
SELECT public.replace_fk_set_null('notes', 'created_by');
SELECT public.replace_fk_set_null('updates', 'author_id');
SELECT public.replace_fk_set_null('leads', 'created_by');
SELECT public.replace_fk_set_null('clients', 'created_by');
SELECT public.replace_fk_set_null('lead_activities', 'author_id');
SELECT public.replace_fk_set_null('client_activities', 'author_id');
SELECT public.replace_fk_set_null('ai_memory', 'created_by');

DO $$ BEGIN
  PERFORM public.replace_fk_set_null('client_project_access', 'created_by');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Portal feedback: keep rows, drop author link if user removed
DO $$ BEGIN
  PERFORM public.replace_fk_set_null('client_feedback', 'author_id');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP FUNCTION IF EXISTS public.replace_fk_set_null(TEXT, TEXT, TEXT);

SELECT 'Safe delete migration applied — deleting users no longer wipes leads/projects' AS status;
