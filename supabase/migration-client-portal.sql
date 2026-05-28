-- Client portal migration (safe to re-run)
-- Run after schema.sql and migration-leads-clients.sql

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('founder', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feedback_status AS ENUM ('new', 'triaged', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_type user_type NOT NULL DEFAULT 'founder';

CREATE TABLE IF NOT EXISTS client_project_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_profile_id, project_id)
);

CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_client_access_profile ON client_project_access(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_access_project ON client_project_access(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project ON client_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_author ON client_feedback(author_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON client_feedback(status);

DROP TRIGGER IF EXISTS client_feedback_updated_at ON client_feedback;
CREATE TRIGGER client_feedback_updated_at BEFORE UPDATE ON client_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE client_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_founder(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid AND p.user_type = 'founder'
  );
$$;

-- Replace permissive policies with founder/client-aware policies
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Profiles readable to founders and self" ON profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR user_type = 'founder'
    OR public.is_founder(auth.uid())
  );
CREATE POLICY "Profiles insert own row" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update self or founder" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_founder(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON projects;
CREATE POLICY "Projects founders full access" ON projects
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Projects client read assigned only" ON projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = projects.id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON tasks;
CREATE POLICY "Tasks founders full access" ON tasks
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Tasks client read assigned projects only" ON tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = tasks.project_id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON notes;
CREATE POLICY "Notes founders only" ON notes
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON updates;
CREATE POLICY "Updates founders full access" ON updates
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Updates client read assigned projects only" ON updates
  FOR SELECT TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = updates.project_id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON leads;
CREATE POLICY "Leads founders only" ON leads
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON clients;
CREATE POLICY "Clients founders full access" ON clients
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Clients client read own company" ON clients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.client_id = clients.id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON lead_activities;
CREATE POLICY "Lead activities founders only" ON lead_activities
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON client_activities;
CREATE POLICY "Client activities founders full access" ON client_activities
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Client activities client read own" ON client_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.client_id = client_activities.client_id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON tags;
CREATE POLICY "Tags founders only" ON tags
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON project_tags;
CREATE POLICY "Project tags founders only" ON project_tags
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON note_tags;
CREATE POLICY "Note tags founders only" ON note_tags
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Founders full access" ON project_links;
CREATE POLICY "Project links founders full access" ON project_links
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Project links client read assigned projects only" ON project_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = project_links.project_id
        AND cpa.client_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders full access" ON ai_memory;
CREATE POLICY "AI memory founders only" ON ai_memory
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));

DROP POLICY IF EXISTS "Client project access founders full access" ON client_project_access;
DROP POLICY IF EXISTS "Client project access self read" ON client_project_access;
CREATE POLICY "Client project access founders full access" ON client_project_access
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Client project access self read" ON client_project_access
  FOR SELECT TO authenticated
  USING (client_profile_id = auth.uid());

DROP POLICY IF EXISTS "Client feedback founders full access" ON client_feedback;
DROP POLICY IF EXISTS "Client feedback client scoped read" ON client_feedback;
DROP POLICY IF EXISTS "Client feedback client create" ON client_feedback;
CREATE POLICY "Client feedback founders full access" ON client_feedback
  FOR ALL TO authenticated
  USING (public.is_founder(auth.uid()))
  WITH CHECK (public.is_founder(auth.uid()));
CREATE POLICY "Client feedback client scoped read" ON client_feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = client_feedback.project_id
        AND cpa.client_profile_id = auth.uid()
    )
  );
CREATE POLICY "Client feedback client create" ON client_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM client_project_access cpa
      WHERE cpa.project_id = client_feedback.project_id
        AND cpa.client_profile_id = auth.uid()
    )
  );

SELECT 'Client portal migration applied' AS status;
