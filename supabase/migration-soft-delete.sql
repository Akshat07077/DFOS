-- Soft delete columns (safe to re-run)
-- Records are hidden when deleted_at is set; restore by clearing deleted_at.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE updates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE client_feedback ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_active ON clients (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks (deadline) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_active ON notes (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_updates_active ON updates (created_at DESC) WHERE deleted_at IS NULL;

SELECT 'Soft delete columns added' AS status;
