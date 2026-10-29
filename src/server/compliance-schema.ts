export const migration010=[
 `CREATE TABLE compliance_state(office_id text NOT NULL,area text NOT NULL CHECK(area IN ('plaft','privacidad')),revision integer NOT NULL DEFAULT 1,PRIMARY KEY(office_id,area))`,
 `CREATE TABLE compliance_records(id uuid PRIMARY KEY,office_id text NOT NULL,area text NOT NULL CHECK(area IN ('plaft','privacidad')),kind text NOT NULL,title text NOT NULL,person_id uuid REFERENCES persons(id),case_id uuid REFERENCES case_records(id),created_at timestamptz NOT NULL DEFAULT now())`,
 `CREATE TABLE compliance_events(id uuid PRIMARY KEY,record_id uuid NOT NULL REFERENCES compliance_records(id),sequence integer NOT NULL,kind text NOT NULL,data jsonb NOT NULL,sha256 text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(record_id,sequence))`,
 `CREATE TABLE compliance_requests(request_id uuid PRIMARY KEY,office_id text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),request_hash text NOT NULL,result jsonb NOT NULL)`,
 `CREATE TABLE compliance_artifacts(id uuid PRIMARY KEY REFERENCES compliance_records(id),contract text NOT NULL,content text NOT NULL,sha256 text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
 ...['compliance_records','compliance_events','compliance_requests','compliance_artifacts'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE OR DELETE ON ${t} FOR EACH ROW EXECUTE FUNCTION case_append_only()`),
 `CREATE INDEX compliance_office_area ON compliance_records(office_id,area)`,
 'INSERT INTO platform_migrations(version) VALUES(10)',
];
