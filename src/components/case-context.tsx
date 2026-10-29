'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {api} from '@/lib/api';
import type {CaseSummary} from '@/lib/case-domain';
export type Overview={total:number;pending:number;reviewed:number;accepted:number;recent:CaseSummary[]};
const Context=createContext<{data:Overview|null;error:string;revision:number;refresh:()=>void}>({data:null,error:'',revision:0,refresh:()=>{}});
export function CaseProvider({enabled,children}:{enabled:boolean;children:ReactNode}){
  const [data,setData]=useState<Overview|null>(null);const [error,setError]=useState('');const [revision,setRevision]=useState(0);const path=usePathname();
  useEffect(()=>{if(!enabled)return;const controller=new AbortController();api<Overview>('/api/cases/overview',{signal:controller.signal}).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[enabled,path,revision]);
  return <Context value={{data:enabled?data:null,error:enabled?error:'',revision,refresh:()=>setRevision(v=>v+1)}}>{children}</Context>;
}
export function useCaseOverview(){return useContext(Context);}
export function useCaseResource<T>(path:string){
  const {revision}=useCaseOverview();const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [local,setLocal]=useState(0);
  useEffect(()=>{const controller=new AbortController();api<T>(path,{signal:controller.signal}).then(value=>{setData(value);setError('');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[path,revision,local]);
  return {data,error,reload:()=>setLocal(v=>v+1)};
}
