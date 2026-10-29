export const migration006=[
  `CREATE TABLE tariff_state(office_id text PRIMARY KEY, revision integer NOT NULL DEFAULT 1 CHECK(revision>0))`,
  `CREATE TABLE tariff_items(id uuid PRIMARY KEY,office_id text NOT NULL,code text NOT NULL,UNIQUE(office_id,code))`,
  `CREATE TABLE tariff_versions(id uuid PRIMARY KEY,tariff_id uuid NOT NULL REFERENCES tariff_items(id),version integer NOT NULL CHECK(version>0),description text NOT NULL,category text NOT NULL CHECK(category IN ('Honorarios','Terceros','Otros')),unit_amount numeric(11,2) NOT NULL CHECK(unit_amount>0),act text CHECK(act IN ('Compraventa','Certificación de firmas','Carta notarial')),active boolean NOT NULL,reason text NOT NULL,created_by text NOT NULL REFERENCES staff(user_id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(tariff_id,version))`,
  `CREATE TABLE tariff_requests(request_id uuid PRIMARY KEY,office_id text NOT NULL,actor_id text NOT NULL REFERENCES staff(user_id),request_hash text NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE case_quote_tariffs(quote_id uuid NOT NULL REFERENCES case_quotes(id),line_index integer NOT NULL CHECK(line_index>=0),tariff_version_id uuid NOT NULL REFERENCES tariff_versions(id),PRIMARY KEY(quote_id,line_index))`,
  ...['tariff_items','tariff_versions','tariff_requests','case_quote_tariffs'].map(table=>`CREATE TRIGGER ${table}_immutable BEFORE UPDATE OR DELETE ON ${table} FOR EACH ROW EXECUTE FUNCTION case_append_only()`),
  'INSERT INTO platform_migrations(version) VALUES(6)',
];
