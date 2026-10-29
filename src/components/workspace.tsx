'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { House, FolderSimple, Users, Files, Wallet, PaperPlaneTilt, CalendarBlank, ShieldCheck, GearSix, MagnifyingGlass, CaretRight, CaretDown, Sun, Moon, List, X, SignOut } from '@phosphor-icons/react';
import { useTheme } from './theme';
import { Badge, Empty } from './ui';
import type { Case } from '@/lib/domain';
import type { CaseSummary } from '@/lib/case-domain';
import { PersistentDashboard, PersistentCaseList, PersistentNewCase, PersistentCaseDetail } from './persistent-cases';
import { useCaseOverview, useCaseResource } from './case-context';
import { SupportingPage } from './supporting-pages';
import { Access, Logo } from './access';
import { PlatformPage } from './platform-pages';
import { useUser, signOut } from './platform-context';
import { TemplatePage } from './template-pages';
import { TariffPage } from './tariff-pages';
import { FiscalPage } from './fiscal-pages';
import {CompliancePage} from './compliance-pages';
import {IntegrationPage} from './integration-pages';
import { FinancePage } from './finance-pages';

const nav = [
  { href: '/inicio', label: 'Mi jornada', icon: House },
  { href: '/expedientes', label: 'Expedientes', icon: FolderSimple },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/documentos', label: 'Documentos', icon: Files },
  { href: '/plantillas', label: 'Plantillas jurídicas', icon: Files },
  { href: '/tarifario', label: 'Tarifario', icon: Wallet },
  { href: '/fiscal', label: 'Fiscal · pruebas', icon: Files },
  { href: '/integraciones/reniec', label: 'Integraciones y traslados', icon: PaperPlaneTilt },
  { href: '/caja', label: 'Caja y cobros', icon: Wallet },
  { href: '/diligencias', label: 'Diligencias', icon: PaperPlaneTilt },
  { href: '/agenda', label: 'Agenda', icon: CalendarBlank },
];
export function PageHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) { return <div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="heading-actions">{children}</div></div>; }
export function Workspace() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const { dark, setDark } = useTheme();
  const {data}=useCaseOverview();
  const user=useUser();
  const search = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (menu) document.querySelector<HTMLButtonElement>('.mobile-close')?.focus();
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.current?.showModal(); }
      if (e.key === 'Escape' && menu) { setMenu(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); }
      if (e.key === 'Tab' && menu) {
        const items = [...document.querySelectorAll<HTMLElement>('.sidebar a, .sidebar button')].filter(el => el.getClientRects().length > 0);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [menu]);
  if (path === '/acceso' || path === '/' || path === '/login') return <Access />;
  let content: ReactNode;
  if (path === '/' || path === '/inicio') content = <PersistentDashboard />;
  else if (path === '/expedientes/nuevo') content = <PersistentNewCase />;
  else if (path.startsWith('/expedientes/')) content = <PersistentCaseDetail key={path} id={path.split('/')[2]} section={path.split('/')[3] || 'resumen'} />;
  else if (path === '/expedientes') content = <PersistentCaseList />;
  else if (path.startsWith('/cumplimiento')) content = <CompliancePage path={path}/>;
  else if (path.startsWith('/integraciones')) content = <IntegrationPage key={path} path={path}/>;
  else if (path === '/fiscal') content = <FiscalPage/>;
  else if (path === '/plantillas') content = <TemplatePage/>;
  else if (path === '/tarifario') content = <TariffPage/>;
  else if (path === '/caja' || path.startsWith('/caja/')) content = <FinancePage path={path}/>;
  else if (['/personas','/documentos','/seguridad','/configuracion','/auditoria'].includes(path)) content = <PlatformPage path={path} />;
  else content = <SupportingPage path={path} />;
  return <div className="app-shell">
    <a className="skip" href="#contenido">Ir al contenido</a>
    {menu && <button className="nav-scrim" aria-label="Cerrar navegación" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'is-open' : ''}`} aria-label="Navegación principal">
      <Logo /><button className="mobile-close icon-btn" aria-label="Cerrar menú" onClick={() => setMenu(false)}><X size={22} aria-hidden /></button>
      <div className="office"><span className="office-dot" /><div>Notaría de demostración<small>Oficina principal · Lima</small></div></div>
      <div className="nav-label">Espacio de trabajo</div>
      <nav>{nav.map(({ href, label, icon: Icon }) => <Link key={href} onClick={() => setMenu(false)} href={href} className={`nav-link ${(path === '/' && href === '/inicio') || path.startsWith(href) ? 'active' : ''}`} aria-current={(path === '/' && href === '/inicio') || path.startsWith(href) ? 'page' : undefined}><Icon size={20} aria-hidden />{label}{href === '/expedientes' && <span className="nav-count">{data?.total??0}</span>}</Link>)}</nav>
      <div className="nav-label second-label">Administración</div><nav><Link onClick={() => setMenu(false)} className={`nav-link ${path.includes('cumplimiento') ? 'active' : ''}`} href="/cumplimiento/plaft"><ShieldCheck size={20} aria-hidden />Cumplimiento</Link><Link onClick={() => setMenu(false)} className={`nav-link ${path === '/configuracion' ? 'active' : ''}`} href="/configuracion"><GearSix size={20} aria-hidden />Configuración</Link></nav>
      <div className="sidebar-bottom"><div className="demo-label"><span />Entorno de demostración</div><p>Trabaja con datos ficticios.<br />Expedientes y versiones persistentes.</p><button className="exit-link" onClick={()=>void signOut()}><SignOut size={18} aria-hidden />Cerrar sesión</button></div>
    </aside>
    <div className="workspace"><TopNavigation path={path} menu={menu} openMenu={() => setMenu(true)} search={() => search.current?.showModal()} dark={dark} setDark={setDark} />
      <div className="demo-strip"><span><span className="demo-dot" />Entorno de revisión</span><span>Expedientes y caja persistentes · Integraciones sin conectar</span><Badge>Fase 6 · Preparación local</Badge></div>
      <main id="contenido" tabIndex={-1} key={path} className="main-content">{content}</main><footer className="app-footer"><span>© 2026 Clix Web Studio <span className="footer-version">/ NotariaOS · Expedientes</span></span><span>Una notaría. Todo tu equipo.</span></footer>
    </div>
    {user?.mfa&&user.role!=='caja'&&<CaseSearch dialogRef={search}/>}
  </div>;
}
function TopNavigation({ path, menu, openMenu, search, dark, setDark }: { path: string; menu: boolean; openMenu: () => void; search: () => void; dark: boolean; setDark: (b: boolean) => void }) {
  const user = useUser();
  const primary = nav.filter(n => ['/inicio', '/expedientes', '/personas', '/caja'].includes(n.href));
  const extra = [...nav.filter(n => ['/documentos', '/plantillas', '/tarifario', '/fiscal', '/integraciones/reniec', '/diligencias', '/agenda'].includes(n.href)), { href: '/cumplimiento/plaft', label: 'Cumplimiento', icon: ShieldCheck }, { href: '/configuracion', label: 'Configuración', icon: GearSix }];
  return <header className="eldial-topnav"><button className="icon-btn menu-toggle" aria-label="Abrir navegación" aria-expanded={menu} onClick={openMenu}><List size={23} aria-hidden /></button><Link className="eldial-header-brand" href="/inicio" aria-label="NotariaOS, inicio"><Logo /></Link><nav className="eldial-desktop-links" aria-label="Navegación de escritorio">{primary.map(({href, label, icon: Icon}) => <Link key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}><Icon size={17} aria-hidden />{href === '/inicio' ? 'Dashboard' : label}</Link>)}<details className="eldial-more"><summary><span>Más</span><CaretDown aria-hidden size={13} /></summary><div>{extra.map(({href, label, icon: Icon}) => <Link key={href} href={href} onClick={e => e.currentTarget.closest('details')?.removeAttribute('open')}><Icon size={18} aria-hidden />{label}</Link>)}</div></details></nav><div className="eldial-header-actions"><Link className="eldial-office" href="/configuracion">Oficina principal<CaretDown size={12} aria-hidden /></Link><button className="icon-btn global-search" aria-label="Buscar expediente o persona" title="Buscar · Ctrl K" onClick={search}><MagnifyingGlass size={20} aria-hidden /></button><button className="icon-btn" aria-label={dark ? 'Activar tema claro' : 'Activar tema oscuro'} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}</button><div className="profile"><Link className="avatar" href="/seguridad" aria-label="Seguridad de mi cuenta">{user?.name.slice(0,1)||"U"}</Link><span>{user?.name||"Personal"}<small>{user?.role||"Cuenta"}</small></span></div><button className="icon-btn nav-signout" onClick={()=>void signOut()} aria-label="Cerrar sesión"><SignOut size={19} aria-hidden /></button></div></header>;
}

function CaseSearch({dialogRef}:{dialogRef:RefObject<HTMLDialogElement|null>}){
 const [search,setSearch]=useState('');
 const {data,error}=useCaseResource<{items:CaseSummary[]}>('/api/cases?'+new URLSearchParams({search,pageSize:'8'}));
 return <dialog ref={dialogRef} className="modal search-modal" aria-label="Buscar expediente"><header><h2>Buscar en expedientes</h2><button className="icon-btn" aria-label="Cerrar búsqueda" onClick={()=>dialogRef.current?.close()}><X size={20} aria-hidden/></button></header><label className="field">Kardex, persona o acto<input autoFocus value={search} onChange={e=>setSearch(e.target.value)} maxLength={150} placeholder="Buscar por kardex, persona o asunto"/></label><div className="search-results">{data?.items.map(c=><Link key={c.id} href={'/expedientes/'+c.id} onClick={()=>dialogRef.current?.close()}><FolderSimple size={20} aria-hidden/><span><strong>{c.kardex}</strong><small>{c.applicant} · {c.act}</small></span><CaretRight size={16} aria-hidden/></Link>)}{error&&<p className="form-error">{error}</p>}{data&&!data.items.length&&<Empty title="Sin coincidencias"><p>Prueba con otro nombre o kardex.</p></Empty>}</div></dialog>;
}
// Compatibility for historical prototype sources, not a live data route.
export function CaseLink({c,children}:{c:Case;children?:ReactNode}){return <Link className="text-link" href={'/expedientes/'+c.id}>{children||c.id}</Link>;}
