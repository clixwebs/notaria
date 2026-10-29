'use client';
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { api,authPost } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { CaseProvider } from './case-context';
export type CurrentUser={id:string;name:string;email:string;role:string;office:string;mfa:boolean;sessionId:string};
const Context=createContext<CurrentUser|null>(null);
export function PlatformContext({children}:{children:ReactNode}){
  const [user,setUser]=useState<CurrentUser|null>(null);
  const path=usePathname();
  useEffect(()=>{if(['/','/acceso','/login'].includes(path))return;api<CurrentUser>('me').then(setUser).catch(()=>{});},[path]);
  return <Context value={user}><CaseProvider enabled={!!user?.mfa&&user.role!=='caja'}>{children}</CaseProvider></Context>;
}
export function useUser(){return useContext(Context);}
export async function signOut(){try{await authPost('sign-out');window.location.assign(new URL('/acceso',window.location.origin).href);}catch{window.alert('No se pudo cerrar la sesión. Vuelve a intentarlo.');}}
