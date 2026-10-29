// Versioned PostgreSQL schema; applies only to the isolated NotariaOS database.
export const migration001 = `
CREATE TABLE IF NOT EXISTS platform_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE notary_settings(id integer PRIMARY KEY CHECK(id=1), name text NOT NULL, office text NOT NULL, revision integer NOT NULL DEFAULT 1);
INSERT INTO notary_settings VALUES(1,'Notaría de prueba','Oficina principal · Lima',1);
CREATE TABLE staff(user_id text PRIMARY KEY REFERENCES "user"(id), role text NOT NULL CHECK(role IN ('administracion','recepcion','abogado','notario','caja')), active boolean NOT NULL DEFAULT true, office_id text NOT NULL DEFAULT 'principal');
CREATE TABLE setup_claim(id integer PRIMARY KEY CHECK(id=1), created_at timestamptz DEFAULT now());
CREATE TABLE persons(id uuid PRIMARY KEY, office_id text NOT NULL, name text NOT NULL, document_type text NOT NULL CHECK(document_type IN ('DNI','CE','PASAPORTE','DEMO')), document_number text NOT NULL, revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_type,document_number));
CREATE TABLE representations(id uuid PRIMARY KEY, person_id uuid NOT NULL REFERENCES persons(id), principal_id uuid NOT NULL REFERENCES persons(id), reference text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(person_id<>principal_id));
CREATE TABLE private_documents(id uuid PRIMARY KEY, office_id text NOT NULL, person_id uuid NOT NULL REFERENCES persons(id), title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE document_versions(id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES private_documents(id), version integer NOT NULL, filename text NOT NULL, media_type text NOT NULL, size integer NOT NULL CHECK(size>0 AND size<=5242880), sha256 text NOT NULL, content bytea NOT NULL, status text NOT NULL DEFAULT 'cuarentena' CHECK(status IN ('cuarentena','liberado','rechazado')), review_note text, reviewed_by text REFERENCES "user"(id), created_by text NOT NULL REFERENCES "user"(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,version));
CREATE TABLE audit_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id text, action text NOT NULL, resource text NOT NULL, result text NOT NULL DEFAULT 'ok', at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION protect_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit is append-only'; END; $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION protect_audit();
INSERT INTO platform_migrations(version) VALUES(1);
`.trim().split('\n');
export const migration002 = [
  `CREATE FUNCTION protect_document_version() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' THEN RAISE EXCEPTION 'document versions cannot be deleted'; END IF; IF ROW(OLD.document_id,OLD.version,OLD.filename,OLD.media_type,OLD.size,OLD.sha256,OLD.content,OLD.created_by,OLD.created_at) IS DISTINCT FROM ROW(NEW.document_id,NEW.version,NEW.filename,NEW.media_type,NEW.size,NEW.sha256,NEW.content,NEW.created_by,NEW.created_at) THEN RAISE EXCEPTION 'document bytes and version metadata are immutable'; END IF; IF OLD.status<>'cuarentena' THEN RAISE EXCEPTION 'review is immutable'; END IF; RETURN NEW; END; $$`,
  'CREATE TRIGGER document_version_immutable BEFORE UPDATE OR DELETE ON document_versions FOR EACH ROW EXECUTE FUNCTION protect_document_version()',
  'INSERT INTO platform_migrations(version) VALUES(2)',
];
