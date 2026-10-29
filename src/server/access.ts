import { platform, query, audit, baseURL, type Connection } from './platform.ts';
export type Role = 'administracion' | 'recepcion' | 'abogado' | 'notario' | 'caja';
export type Permission = 'people:read' | 'people:write' | 'documents:read' | 'documents:write' | 'documents:release' | 'settings:manage' | 'audit:read' | 'users:manage' | 'case:read' | 'case:write' | 'case:review' | 'quote:write' | 'finance:read' | 'finance:write' | 'finance:manage' | 'tariff:read' | 'tariff:manage' | 'fiscal:read' | 'fiscal:prepare' | 'fiscal:simulate' | 'template:read' | 'template:publish' | 'template:use' | 'procedure:read' | 'procedure:write' | 'procedure:authorize' | 'compliance:plaft' | 'compliance:privacy';
const roles: Record<Role, readonly Permission[]> = {
  administracion: ['people:read', 'people:write', 'documents:read', 'documents:write', 'documents:release', 'settings:manage', 'audit:read', 'users:manage','compliance:privacy','case:read','case:write','quote:write','finance:read','finance:write','finance:manage','tariff:read','tariff:manage','fiscal:read','fiscal:prepare','fiscal:simulate','template:read','template:use','procedure:read','procedure:write'],
  recepcion: ['people:read', 'people:write', 'documents:read', 'documents:write','case:read','case:write','quote:write','tariff:read','template:read','template:use','procedure:read','procedure:write'],
  abogado: ['people:read', 'people:write', 'documents:read', 'documents:write','case:read','case:write','case:review','tariff:read','template:read','template:use','template:publish','procedure:read','procedure:write'],
  notario: ['people:read', 'people:write', 'documents:read', 'documents:write', 'documents:release','case:read','case:write','case:review','tariff:read','template:read','template:use','template:publish','procedure:read','procedure:write','procedure:authorize','compliance:plaft','compliance:privacy'],
  caja: ['finance:read','finance:write','tariff:read','fiscal:read','fiscal:simulate'],
};
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function assertOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(baseURL).origin) throw new HttpError(403, 'Origen de la solicitud no autorizado.');
}
export function hasPermission(role: string, permission: Permission) { return Object.hasOwn(roles, role) && roles[role as Role].includes(permission); }
export async function actor(headers: Headers, permission?: Permission, options?: { enrollment?: boolean; fresh?: boolean }) {
  const { auth, db } = await platform();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new HttpError(401, 'Inicia sesión para continuar.');
  const [staff] = await query<{ role: Role; active: boolean; office_id: string }>(db, 'SELECT role,active,office_id FROM staff WHERE user_id=$1', [session.user.id]);
  if (!staff?.active) throw new HttpError(403, 'Usuario no habilitado.');
  if (!options?.enrollment && !session.user.twoFactorEnabled) throw new HttpError(403, 'Configura y verifica el segundo factor antes de acceder.');
  if (permission && !hasPermission(staff.role, permission)) {
    await audit(db, session.user.id, 'access.denied', permission, 'denied');
    throw new HttpError(403, 'Tu perfil no tiene permiso para esta acción.');
  }
  if (options?.fresh && Date.now() - new Date(session.session.createdAt).getTime() > 15 * 60 * 1000) throw new HttpError(403, 'Vuelve a iniciar sesión con segundo factor para esta acción.');
  return { id: session.user.id, name: session.user.name, email: session.user.email, role: staff.role, office: staff.office_id, mfa: session.user.twoFactorEnabled, sessionId: session.session.id };
}
export async function requirePerson(db: Connection, id: string, office: string) {
  const [person] = await query(db, 'SELECT id FROM persons WHERE id=$1 AND office_id=$2', [id, office]);
  if (!person) throw new HttpError(404, 'Persona no disponible.');
}
