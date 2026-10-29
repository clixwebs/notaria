export const migration011=[
 `CREATE TABLE integration_state(office_id text NOT NULL,channel text NOT NULL CHECK(channel IN ('reniec','sunarp','fiscal')),revision integer NOT NULL DEFAULT 1,PRIMARY KEY(office_id,channel))`,
 `CREATE TABLE integration_records(id uuid PRIMARY KEY,office_id text NOT NULL,channel text NOT NULL CHECK(channel IN ('reniec','sunarp','fiscal')),kind text NOT NULL,title text NOT NULL,case_id uuid REFERENCES case_records(id))`,
 `CREATE TABLE integration_events(id uuid PRIMARY KEY,record_id uuid NOT NULL REFERENCES integration_records(id),sequence integer NOT NULL,kind text NOT NULL,data jsonb NOT NULL,sha256 text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(record_id,sequence))`,
 `CREATE TABLE integration_requests(request_id uuid PRIMARY KEY,office_id text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),request_hash text NOT NULL,result jsonb NOT NULL)`,
 `CREATE TABLE integration_artifacts(id uuid PRIMARY KEY REFERENCES integration_records(id),content text NOT NULL,sha256 text NOT NULL)`,
 ...['integration_records','integration_events','integration_requests','integration_artifacts'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE OR DELETE ON ${t} FOR EACH ROW EXECUTE FUNCTION case_append_only()`),
 'CREATE INDEX integration_office_channel ON integration_records(office_id,channel)',
 'INSERT INTO platform_migrations(version) VALUES(11)',
];
