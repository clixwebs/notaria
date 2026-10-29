import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PGliteDialect, PostgresDialect, CompiledQuery, type Transaction } from 'kysely';
import { Pool } from 'pg';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { twoFactor } from 'better-auth/plugins';
import { getMigrations } from 'better-auth/db/migration';
import { migration001,migration002 } from './schema.ts';
import { migration003,migration004 } from './case-schema.ts';
import { migration005 } from './finance-schema.ts';
import { migration006 } from './tariff-schema.ts';
import { migration007 } from './fiscal-schema.ts';
import { migration008 } from './template-schema.ts';
import { migration009 } from './procedure-schema.ts';
import { migration010 } from './compliance-schema.ts';
import { migration011 } from './integration-schema.ts';

export type Database = Record<string, Record<string, unknown>>;
export type Connection = Kysely<Database> | Transaction<Database>;
export async function query<T>(db: Connection, text: string, values: unknown[] = []): Promise<T[]> {
  return (await db.executeQuery<T>(CompiledQuery.raw(text, values))).rows;
}
export async function audit(db: Connection, actor: string | null, action: string, resource: string, result = 'ok') {
  await query(db, 'INSERT INTO audit_events(actor_id,action,resource,result) VALUES($1,$2,$3,$4)', [actor, action, resource, result]);
}
export const baseURL = process.env.NOTARIA_URL || 'http://127.0.0.1:3100';
function secret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Configure BETTER_AUTH_SECRET before external hosting.');
  const directory = resolve(/* turbopackIgnore: true */ process.env.NOTARIA_DATA_DIR || '.notaria');
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'auth-secret');
  try { return readFileSync(path, 'utf8'); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const value = randomBytes(48).toString('base64url');
    try { writeFileSync(path, value, { flag: 'wx', mode: 0o600 }); return value; }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'EEXIST') return readFileSync(path, 'utf8'); throw e; }
  }
}
async function initialize() {
  if(process.env.VERCEL&&(!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET||!process.env.NOTARIA_URL))throw new Error('Cloud deployment requires DATABASE_URL, BETTER_AUTH_SECRET and NOTARIA_URL.');
  if(process.env.VERCEL&&process.env.NOTARIA_MIGRATE==='1')throw new Error('Run migrations from the release command, never a web function.');
  const directory = resolve(/* turbopackIgnore: true */ process.env.NOTARIA_DATA_DIR || '.notaria');
  if(!process.env.DATABASE_URL)mkdirSync(directory, { recursive: true });
  const db = new Kysely<Database>({ dialect: process.env.DATABASE_URL
    ? new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) })
    : new PGliteDialect({ pglite: new PGlite(join(directory, 'postgres')) }) });
  const options = {
    appName: 'NotariaOS', baseURL, secret: secret(),
    database: { db, type: 'postgres' },
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, autoSignIn: false },
    session: { expiresIn: 60 * 60 * 8, freshAge: 60 * 15, disableSessionRefresh: true, cookieCache: { enabled: false } },
    trustedOrigins: [baseURL],
    advanced: { useSecureCookies: baseURL.startsWith('https:'), ipAddress: { ipAddressHeaders: ['x-notaria-internal-ip'] } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60, customRules: { '/sign-in/email': { window: 60, max: 8 }, '/two-factor/*': { window: 60, max: 10 } } },
    databaseHooks: { session: { create: { before: async session => {
      const [staff]=await query<{active:boolean}>(db,'SELECT active FROM staff WHERE user_id=$1',[session.userId]);
      if(!staff?.active)return false;
      await audit(db,session.userId,'session.issue-attempt','authentication','attempt');
      return {data:session};
    } } } },
    plugins: [twoFactor({ issuer: 'NotariaOS', backupCodeOptions: { storeBackupCodes: 'encrypted' } })],
  } satisfies BetterAuthOptions;
  // Explicit, deterministic initialization for this local review environment.
  // Operational deployments must run reviewed migrations as a separate release step.
  const migrate=!process.env.DATABASE_URL||process.env.NOTARIA_MIGRATE==='1';
  if(migrate){
  const migrations = await getMigrations(options);
  await migrations.runMigrations();
  await query(db, 'CREATE TABLE IF NOT EXISTS platform_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  if (!(await query(db, 'SELECT version FROM platform_migrations WHERE version=1')).length) {
    await db.transaction().execute(async tx => { for(const statement of migration001) await query(tx, statement); });
  }
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=2')).length) await db.transaction().execute(async tx=>{for(const statement of migration002)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=3')).length) await db.transaction().execute(async tx=>{for(const statement of migration003)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=4')).length) await db.transaction().execute(async tx=>{for(const statement of migration004)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=5')).length) await db.transaction().execute(async tx=>{for(const statement of migration005)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=6')).length) await db.transaction().execute(async tx=>{for(const statement of migration006)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=7')).length) await db.transaction().execute(async tx=>{for(const statement of migration007)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=8')).length) await db.transaction().execute(async tx=>{for(const statement of migration008)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=9')).length) await db.transaction().execute(async tx=>{for(const statement of migration009)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=10')).length) await db.transaction().execute(async tx=>{for(const statement of migration010)await query(tx,statement);});
  if (!(await query(db,'SELECT version FROM platform_migrations WHERE version=11')).length) await db.transaction().execute(async tx=>{for(const statement of migration011)await query(tx,statement);});
  }else{
    const versions=await query<{version:number}>(db,'SELECT version FROM platform_migrations ORDER BY version');
    if(versions.length!==11||versions.some((v,i)=>v.version!==i+1))throw new Error('Database migration required before release.');
  }
  const auth=betterAuth(options);
  return { db, auth };
}
type Platform = Awaited<ReturnType<typeof initialize>>;
const shared = globalThis as typeof globalThis & { notariaPlatform?: Promise<Platform> };
export function platform() { return shared.notariaPlatform ??= initialize(); }
