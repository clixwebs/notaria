'use client';
import Link from 'next/link';
import {LockKey} from '@phosphor-icons/react';
import {PageHeading} from './workspace';
import {Badge,Empty} from './ui';
export function SupportingPage({path}:{path:string}){
 if(path.startsWith('/cumplimiento'))return <><PageHeading title="Cumplimiento" description="Espacio previsto para procedimientos reservados y privacidad."/><section className="panel reserved-panel"><LockKey size={32} aria-hidden/><Badge>Fase 5</Badge><h2>Gestión reservada en preparación</h2><p>Los permisos específicos, formatos y reglas de este módulo se habilitarán tras su implementación y validación.</p><Link className="btn" href="/inicio">Volver a mi jornada</Link></section></>;
 const info:Record<string,[string,string]>={'/caja':['Caja y cobros','Fase 4 · Cargos, anticipos, gastos, fondos de terceros y conciliación. Los presupuestos actuales no generan movimientos de caja.'],'/diligencias':['Diligencias','La persistencia de intentos, constancias y entrega se incorporará en el corte de actuaciones.'],'/agenda':['Agenda','Fase 7 · Las tareas y fechas internas ya se registran dentro de cada expediente.'],'/sala':['Sala de firmas','La sala depende de identificación, otorgamientos y firma habilitadas.'],'/portal':['Portal del cliente','Fase 7 · Se habilitará acceso del cliente por relación autorizada con cada recurso.']};
 const [title,description]=info[path]||['Vista no disponible','Continúa desde la bandeja de expedientes.'];
 return <><PageHeading title={title} description={description}/><Empty title="Módulo en preparación"><p>Su desarrollo continúa según el plan. Los expedientes, requisitos, borradores y presupuestos ya son persistentes.</p><Link className="btn primary" href="/expedientes">Abrir expedientes</Link></Empty></>;
}
