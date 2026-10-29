export const migration009=[
  `CREATE TABLE procedure_events(id uuid PRIMARY KEY,case_id uuid NOT NULL REFERENCES case_records(id),sequence integer NOT NULL,kind text NOT NULL CHECK(kind IN ('identity','identity-resolve','identity-exception','grant','authorize','void','schedule','diligence','diligence-resolve','certificate','delivery')),data jsonb NOT NULL,sha256 text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(case_id,sequence))`,
  `CREATE TABLE procedure_requests(request_id uuid PRIMARY KEY,office_id text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),request_hash text NOT NULL,result jsonb NOT NULL)`,
  `CREATE TABLE instrument_counters(office_id text NOT NULL,year integer NOT NULL,act text NOT NULL,value integer NOT NULL DEFAULT 0 CHECK(value>=0),folio integer NOT NULL DEFAULT 0 CHECK(folio>=0),PRIMARY KEY(office_id,year,act))`,
  ...['procedure_events','procedure_requests'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE OR DELETE ON ${t} FOR EACH ROW EXECUTE FUNCTION case_append_only()`),
  `CREATE INDEX procedure_case_sequence ON procedure_events(case_id,sequence)`,
  `CREATE UNIQUE INDEX procedure_instrument_number ON procedure_events((data->>'officeId'),(data->>'number')) WHERE kind='authorize'`,
  'INSERT INTO platform_migrations(version) VALUES(9)',
];
