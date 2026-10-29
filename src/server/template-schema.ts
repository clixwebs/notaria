export const migration008=[
  `CREATE TABLE template_state(office_id text PRIMARY KEY,revision integer NOT NULL DEFAULT 1 CHECK(revision>0))`,
  `CREATE TABLE legal_templates(id uuid PRIMARY KEY,office_id text NOT NULL,code text NOT NULL,UNIQUE(office_id,code))`,
  `CREATE TABLE legal_template_versions(id uuid PRIMARY KEY,template_id uuid NOT NULL REFERENCES legal_templates(id),version integer NOT NULL CHECK(version>0),title text NOT NULL,act text NOT NULL CHECK(act IN ('Compraventa','Certificación de firmas','Carta notarial')),body text NOT NULL,variables jsonb NOT NULL,active boolean NOT NULL,reason text NOT NULL,sha256 text NOT NULL,created_by text NOT NULL REFERENCES staff(user_id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(template_id,version))`,
  `CREATE TABLE template_requests(request_id uuid PRIMARY KEY,office_id text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),kind text NOT NULL CHECK(kind IN ('publish','generate')),request_hash text NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE case_draft_templates(draft_id uuid PRIMARY KEY REFERENCES case_drafts(id),template_version_id uuid NOT NULL REFERENCES legal_template_versions(id),source jsonb NOT NULL)`,
  ...['legal_templates','legal_template_versions','template_requests','case_draft_templates'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE OR DELETE ON ${t} FOR EACH ROW EXECUTE FUNCTION case_append_only()`),
  'INSERT INTO platform_migrations(version) VALUES(8)',
];
